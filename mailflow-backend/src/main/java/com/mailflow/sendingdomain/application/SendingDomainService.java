package com.mailflow.sendingdomain.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.infrastructure.brevo.BrevoDomainClient;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.AuthenticateOutcome;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.DnsRecordItem;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.DnsRecords;
import com.mailflow.infrastructure.brevo.BrevoDomainDtos.DomainSnapshot;
import com.mailflow.sendingdomain.api.request.CreateSendingDomainRequest;
import com.mailflow.sendingdomain.api.response.SendingDomainResponse;
import com.mailflow.sendingdomain.domain.model.DnsRecordPurpose;
import com.mailflow.sendingdomain.domain.model.DnsRecordStatus;
import com.mailflow.sendingdomain.domain.model.DomainDnsRecord;
import com.mailflow.sendingdomain.domain.model.SendingDomain;
import com.mailflow.sendingdomain.domain.model.SendingDomainStatus;
import com.mailflow.sendingdomain.domain.repository.DomainDnsRecordRepository;
import com.mailflow.sendingdomain.domain.repository.SendingDomainRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SendingDomainService {

    /**
     * Brevo GET /senders/domains/{name} does not return numeric id.
     * Use "0" to mark "already synced with Brevo" and avoid re-backfill every verify.
     */
    private static final String BREVO_ID_SYNCED_UNKNOWN = "0";

    private final SendingDomainRepository domainRepository;
    private final DomainDnsRecordRepository recordRepository;
    private final EmailSenderIdentityRepository senderRepository;
    private final WorkspaceAccessService accessService;
    private final BrevoDomainClient brevoDomainClient;
    private final TransactionTemplate transactionTemplate;

    @Transactional(readOnly = true)
    public List<SendingDomainResponse> list(UUID userId, UUID workspaceId, String q, String status) {
        accessService.requireDomainRead(userId, workspaceId);
        SendingDomainStatus statusFilter = parseOptionalStatus(status);
        String like = toLike(q);
        List<SendingDomain> domains = domainRepository.search(workspaceId, like, statusFilter);
        List<SendingDomainResponse> out = new ArrayList<>();
        for (SendingDomain domain : domains) {
            out.add(toResponse(domain));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public SendingDomainResponse get(UUID userId, UUID workspaceId, UUID domainId) {
        accessService.requireDomainRead(userId, workspaceId);
        return toResponse(requireDomain(workspaceId, domainId));
    }

    public SendingDomainResponse create(UUID userId, UUID workspaceId, CreateSendingDomainRequest request) {
        accessService.requireDomainWrite(userId, workspaceId);
        String domainName = SendingDomain.normalizeDomain(request.getDomain());
        if (domainName.isEmpty() || !domainName.contains(".")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "DOMAIN_INVALID",
                    "Vui lòng nhập tên miền hợp lệ (ví dụ: congty.vn).");
        }
        if (domainRepository.existsByDomainIgnoreCase(domainName)) {
            throw new AppException(HttpStatus.CONFLICT, "DOMAIN_EXISTS",
                    "Tên miền đã được đăng ký trên hệ thống MailFlow.");
        }
        brevoDomainClient.requireConfigured();
        DomainSnapshot snapshot = brevoDomainClient.createOrFetchExisting(domainName);
        SendingDomainResponse response = transactionTemplate.execute(status -> {
            SendingDomain domain = new SendingDomain(workspaceId, domainName);
            domain.setBrevoDomainId(resolveBrevoDomainId(snapshot.brevoDomainId()));
            domain = domainRepository.save(domain);
            replaceDnsRecordsFromBrevo(domain, snapshot.dnsRecords(), false);
            return toResponse(domain);
        });
        if (response == null) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "DOMAIN_CREATE_FAILED",
                    "Không lưu được tên miền.");
        }
        return response;
    }

    public void delete(UUID userId, UUID workspaceId, UUID domainId) {
        accessService.requireDomainWrite(userId, workspaceId);
        SendingDomain domain = requireDomain(workspaceId, domainId);
        String domainName = domain.getDomain();
        brevoDomainClient.deleteDomain(domainName);
        transactionTemplate.executeWithoutResult(status -> {
            SendingDomain managed = requireDomain(workspaceId, domainId);
            recordRepository.deleteByDomainId(managed.getId());
            domainRepository.delete(managed);
        });
    }

    public SendingDomainResponse verify(UUID userId, UUID workspaceId, UUID domainId) {
        accessService.requireDomainWrite(userId, workspaceId);
        SendingDomain domain = requireDomain(workspaceId, domainId);
        brevoDomainClient.requireConfigured();

        if (domain.getBrevoDomainId() == null) {
            backfillBrevo(domain);
            domain = requireDomain(workspaceId, domainId);
        }

        String domainName = domain.getDomain();
        AuthenticateOutcome outcome = brevoDomainClient.authenticateDomain(domainName);

        if (outcome == AuthenticateOutcome.SUCCESS) {
            SendingDomainResponse verified = transactionTemplate.execute(status -> {
                SendingDomain managed = requireDomain(workspaceId, domainId);
                List<DomainDnsRecord> records =
                        recordRepository.findByDomainIdOrderByCreatedAtAsc(managed.getId());
                for (DomainDnsRecord record : records) {
                    record.setStatus(DnsRecordStatus.VERIFIED);
                    recordRepository.save(record);
                }
                managed.setStatus(SendingDomainStatus.VERIFIED);
                managed.setVerifiedAt(Instant.now());
                managed = domainRepository.save(managed);
                return toResponse(managed);
            });
            if (verified == null) {
                throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "DOMAIN_VERIFY_FAILED",
                        "Không lưu được kết quả xác thực.");
            }
            return verified;
        }

        DomainSnapshot snapshot = brevoDomainClient.getDomain(domainName);
        SendingDomainResponse pending = transactionTemplate.execute(status -> {
            SendingDomain managed = requireDomain(workspaceId, domainId);
            if (snapshot.brevoDomainId() != null && managed.getBrevoDomainId() == null) {
                managed.setBrevoDomainId(resolveBrevoDomainId(snapshot.brevoDomainId()));
            }
            applyDnsStatusesFromBrevo(managed, snapshot.dnsRecords());
            int ok = 0;
            int total = 0;
            for (DomainDnsRecord record : recordRepository.findByDomainIdOrderByCreatedAtAsc(managed.getId())) {
                if (record.getPurpose() == DnsRecordPurpose.MX) {
                    continue;
                }
                total++;
                if (record.getStatus() == DnsRecordStatus.VERIFIED) {
                    ok++;
                }
            }
            if (total > 0 && ok == total) {
                managed.setStatus(SendingDomainStatus.VERIFIED);
                managed.setVerifiedAt(Instant.now());
            } else if (ok == 0) {
                managed.setStatus(SendingDomainStatus.FAILED);
                managed.setVerifiedAt(null);
            } else {
                managed.setStatus(SendingDomainStatus.PENDING);
                managed.setVerifiedAt(null);
            }
            managed = domainRepository.save(managed);
            return toResponse(managed);
        });
        if (pending == null) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "DOMAIN_VERIFY_FAILED",
                    "Không lưu được kết quả xác thực.");
        }
        return pending;
    }

    public SendingDomain requireDomain(UUID workspaceId, UUID domainId) {
        return domainRepository.findByIdAndWorkspaceId(domainId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tên miền", domainId.toString()));
    }

    private void backfillBrevo(SendingDomain domain) {
        log.info("Backfill Brevo for legacy domain [{}]", domain.getDomain());
        DomainSnapshot snapshot = brevoDomainClient.createOrFetchExisting(domain.getDomain());
        transactionTemplate.executeWithoutResult(status -> {
            SendingDomain managed = domainRepository.findById(domain.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tên miền", domain.getId().toString()));
            managed.setBrevoDomainId(resolveBrevoDomainId(snapshot.brevoDomainId()));
            replaceDnsRecordsFromBrevo(managed, snapshot.dnsRecords(), true);
            domainRepository.save(managed);
        });
    }

    /** Prefer real Brevo id from create; otherwise sentinel so we do not re-backfill forever. */
    private static String resolveBrevoDomainId(String brevoDomainId) {
        return brevoDomainId != null && !brevoDomainId.isBlank() ? brevoDomainId : BREVO_ID_SYNCED_UNKNOWN;
    }

    private void replaceDnsRecordsFromBrevo(SendingDomain domain, DnsRecords dns, boolean clearExisting) {
        if (clearExisting) {
            recordRepository.deleteByDomainId(domain.getId());
        }
        List<DomainDnsRecord> rows = mapBrevoDnsRecords(domain.getId(), dns);
        if (!rows.isEmpty()) {
            recordRepository.saveAll(rows);
        }
    }

    private void applyDnsStatusesFromBrevo(SendingDomain domain, DnsRecords dns) {
        if (dns == null) {
            return;
        }
        List<DomainDnsRecord> existing = recordRepository.findByDomainIdOrderByCreatedAtAsc(domain.getId());
        if (existing.isEmpty()) {
            replaceDnsRecordsFromBrevo(domain, dns, false);
            existing = recordRepository.findByDomainIdOrderByCreatedAtAsc(domain.getId());
        }
        syncItemStatus(existing, DnsRecordPurpose.VERIFY, dns.getBrevoCode());
        syncItemStatus(existing, DnsRecordPurpose.DKIM, dns.getDkim1Record());
        syncItemStatus(existing, DnsRecordPurpose.DKIM, dns.getDkim2Record());
        syncItemStatus(existing, DnsRecordPurpose.DKIM, dns.getDkimRecord());
        syncItemStatus(existing, DnsRecordPurpose.DMARC, dns.getDmarcRecord());
        for (DomainDnsRecord record : existing) {
            recordRepository.save(record);
        }
    }

    private static void syncItemStatus(List<DomainDnsRecord> existing, DnsRecordPurpose purpose, DnsRecordItem item) {
        if (item == null) {
            return;
        }
        boolean ok = Boolean.TRUE.equals(item.getStatus());
        String normalizedHost = normalizeHost(item.getHostName());
        for (DomainDnsRecord record : existing) {
            if (record.getPurpose() == purpose) {
                if (!record.getHost().equalsIgnoreCase(normalizedHost) && !normalizedHost.equals("@")) {
                    continue;
                }
                record.setStatus(ok ? DnsRecordStatus.VERIFIED : DnsRecordStatus.FAILED);
                if (item.getValue() != null && !item.getValue().isBlank()) {
                    record.setValue(item.getValue());
                }
                if (item.getHostName() != null && !item.getHostName().isBlank()) {
                    record.setHost(normalizeHost(item.getHostName()));
                }
                if (item.getType() != null && !item.getType().isBlank()) {
                    record.setType(normalizeType(item.getType()));
                }
            }
        }
    }

    private static List<DomainDnsRecord> mapBrevoDnsRecords(UUID domainId, DnsRecords dns) {
        List<DomainDnsRecord> rows = new ArrayList<>();
        if (dns == null) {
            return rows;
        }
        if (dns.getBrevoCode() != null) {
            rows.add(toEntity(
                    domainId,
                    dns.getBrevoCode(),
                    DnsRecordPurpose.VERIFY,
                    "Mã xác thực Brevo",
                    "Mã chứng thực độc quyền từ hạ tầng gửi thư Brevo."
            ));
        }
        if (dns.getDkim1Record() != null) {
            rows.add(toEntity(
                    domainId,
                    dns.getDkim1Record(),
                    DnsRecordPurpose.DKIM,
                    "Chữ ký số DKIM 1",
                    "Bản ghi DKIM (CNAME) do Brevo cấp để ký email gửi đi."
            ));
        }
        if (dns.getDkim2Record() != null) {
            rows.add(toEntity(
                    domainId,
                    dns.getDkim2Record(),
                    DnsRecordPurpose.DKIM,
                    "Chữ ký số DKIM 2",
                    "Bản ghi DKIM (CNAME) thứ hai do Brevo cấp để xoay vòng khóa."
            ));
        }
        if (dns.getDkimRecord() != null) {
            rows.add(toEntity(
                    domainId,
                    dns.getDkimRecord(),
                    DnsRecordPurpose.DKIM,
                    "Chữ ký số DKIM",
                    "Bản ghi DKIM do Brevo cấp để ký email gửi đi."
            ));
        }
        if (dns.getDmarcRecord() != null) {
            rows.add(toEntity(
                    domainId,
                    dns.getDmarcRecord(),
                    DnsRecordPurpose.DMARC,
                    "Chính sách DMARC",
                    "Chính sách DMARC khuyến nghị từ Brevo."
            ));
        }
        return rows;
    }

    private static DomainDnsRecord toEntity(
            UUID domainId,
            DnsRecordItem item,
            DnsRecordPurpose purpose,
            String name,
            String description
    ) {
        return new DomainDnsRecord(
                domainId,
                normalizeType(item.getType()),
                name,
                normalizeHost(item.getHostName()),
                item.getValue() == null ? "" : item.getValue(),
                purpose,
                description
        );
    }

    private static String normalizeHost(String hostName) {
        if (hostName == null || hostName.isBlank()) {
            return "@";
        }
        String trimmed = hostName.trim();
        return trimmed.endsWith(".") && trimmed.length() > 1
                ? trimmed.substring(0, trimmed.length() - 1)
                : trimmed;
    }

    private static String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "TXT";
        }
        String t = type.trim().toUpperCase(Locale.ROOT);
        if ("TXT".equals(t) || "CNAME".equals(t) || "MX".equals(t)) {
            return t;
        }
        return "TXT";
    }

    private SendingDomainResponse toResponse(SendingDomain domain) {
        List<DomainDnsRecord> records = recordRepository.findByDomainIdOrderByCreatedAtAsc(domain.getId());
        long sendersCount = senderRepository.countByDomainId(domain.getId());
        List<SendingDomainResponse.DnsRecordResponse> recordResponses = new ArrayList<>();
        for (DomainDnsRecord record : records) {
            recordResponses.add(SendingDomainResponse.DnsRecordResponse.builder()
                    .id(record.getId())
                    .type(record.getType())
                    .name(record.getName())
                    .host(record.getHost())
                    .value(record.getValue())
                    .status(record.getStatus().name())
                    .purpose(record.getPurpose().name())
                    .description(record.getDescription())
                    .build());
        }
        return SendingDomainResponse.builder()
                .id(domain.getId())
                .domain(domain.getDomain())
                .status(domain.getStatus().name())
                .createdAt(domain.getCreatedAt())
                .verifiedAt(domain.getVerifiedAt())
                .updatedAt(domain.getUpdatedAt())
                .sendersCount(sendersCount)
                .records(recordResponses)
                .build();
    }

    private SendingDomainStatus parseOptionalStatus(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        try {
            return SendingDomainStatus.fromApi(raw);
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "DOMAIN_STATUS_INVALID",
                    "Trạng thái tên miền không hợp lệ.");
        }
    }

    private static String toLike(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        return "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
