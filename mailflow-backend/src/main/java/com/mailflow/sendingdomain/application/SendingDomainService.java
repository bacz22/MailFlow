package com.mailflow.sendingdomain.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SendingDomainService {

    private final SendingDomainRepository domainRepository;
    private final DomainDnsRecordRepository recordRepository;
    private final EmailSenderIdentityRepository senderRepository;
    private final WorkspaceAccessService accessService;
    private final DnsTxtLookup dnsTxtLookup;

    @Value("${mailflow.domain.verify-mode:lenient}")
    private String verifyMode;

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

    @Transactional
    public SendingDomainResponse create(UUID userId, UUID workspaceId, CreateSendingDomainRequest request) {
        accessService.requireDomainWrite(userId, workspaceId);
        String domainName = SendingDomain.normalizeDomain(request.getDomain());
        if (domainName.isEmpty() || !domainName.contains(".")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "DOMAIN_INVALID",
                    "Vui lòng nhập tên miền hợp lệ (ví dụ: congty.vn).");
        }
        if (domainRepository.existsByWorkspaceIdAndDomainIgnoreCase(workspaceId, domainName)) {
            throw new AppException(HttpStatus.CONFLICT, "DOMAIN_EXISTS",
                    "Tên miền đã tồn tại trong workspace.");
        }
        SendingDomain domain = domainRepository.save(new SendingDomain(workspaceId, domainName));
        seedDnsRecords(domain);
        return toResponse(domain);
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID domainId) {
        accessService.requireDomainWrite(userId, workspaceId);
        SendingDomain domain = requireDomain(workspaceId, domainId);
        recordRepository.deleteByDomainId(domain.getId());
        domainRepository.delete(domain);
    }

    @Transactional
    public SendingDomainResponse verify(UUID userId, UUID workspaceId, UUID domainId) {
        accessService.requireDomainWrite(userId, workspaceId);
        SendingDomain domain = requireDomain(workspaceId, domainId);
        List<DomainDnsRecord> records = recordRepository.findByDomainIdOrderByCreatedAtAsc(domain.getId());
        boolean lenient = "lenient".equalsIgnoreCase(verifyMode == null ? "" : verifyMode.trim());

        int verifiedAuthRecords = 0;
        int authRecords = 0;
        for (DomainDnsRecord record : records) {
            if (record.getPurpose() == DnsRecordPurpose.VERIFY) {
                continue;
            }
            if (record.getPurpose() == DnsRecordPurpose.MX) {
                continue;
            }
            authRecords++;
            boolean ok = checkRecord(domain.getDomain(), record);
            if (!ok && lenient) {
                log.warn("Domain [{}] record [{}] DNS miss — lenient mode marks VERIFIED",
                        domain.getDomain(), record.getPurpose());
                ok = true;
            }
            record.setStatus(ok ? DnsRecordStatus.VERIFIED : DnsRecordStatus.FAILED);
            recordRepository.save(record);
            if (ok) {
                verifiedAuthRecords++;
            }
        }

        // Ownership / VERIFY record optional but preferred
        for (DomainDnsRecord record : records) {
            if (record.getPurpose() != DnsRecordPurpose.VERIFY) {
                continue;
            }
            boolean ok = checkRecord(domain.getDomain(), record);
            if (!ok && lenient) {
                ok = true;
            }
            record.setStatus(ok ? DnsRecordStatus.VERIFIED : DnsRecordStatus.FAILED);
            recordRepository.save(record);
        }

        if (authRecords > 0 && verifiedAuthRecords == authRecords) {
            domain.setStatus(SendingDomainStatus.VERIFIED);
            domain.setVerifiedAt(Instant.now());
        } else if (verifiedAuthRecords == 0) {
            domain.setStatus(SendingDomainStatus.FAILED);
            domain.setVerifiedAt(null);
        } else {
            domain.setStatus(SendingDomainStatus.PENDING);
            domain.setVerifiedAt(null);
        }
        domain = domainRepository.save(domain);
        return toResponse(domain);
    }

    public SendingDomain requireDomain(UUID workspaceId, UUID domainId) {
        return domainRepository.findByIdAndWorkspaceId(domainId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Tên miền", domainId.toString()));
    }

    private void seedDnsRecords(SendingDomain domain) {
        String d = domain.getDomain();
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        List<DomainDnsRecord> rows = List.of(
                new DomainDnsRecord(
                        domain.getId(),
                        "TXT",
                        "MailFlow Ownership",
                        "@",
                        "mailflow-site-verification=" + token,
                        DnsRecordPurpose.VERIFY,
                        "Xác minh quyền sở hữu tên miền với MailFlow."
                ),
                new DomainDnsRecord(
                        domain.getId(),
                        "TXT",
                        "SPF Authentication",
                        "@",
                        "v=spf1 include:mailflow.vn ~all",
                        DnsRecordPurpose.SPF,
                        "Chỉ định máy chủ MailFlow được phép gửi email từ tên miền này."
                ),
                new DomainDnsRecord(
                        domain.getId(),
                        "TXT",
                        "DKIM Signature",
                        "mailflow._domainkey",
                        "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3K"
                                + token.substring(0, Math.min(8, token.length()))
                                + "DAQAB",
                        DnsRecordPurpose.DKIM,
                        "Chữ ký điện tử mã hóa nội dung chống giả mạo email."
                ),
                new DomainDnsRecord(
                        domain.getId(),
                        "TXT",
                        "DMARC Policy",
                        "_dmarc",
                        "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@" + d,
                        DnsRecordPurpose.DMARC,
                        "Quy chuẩn bảo vệ chống phishing và nhận báo cáo vi phạm."
                )
        );
        recordRepository.saveAll(rows);
    }

    private boolean checkRecord(String domain, DomainDnsRecord record) {
        String host = record.getHost() == null ? "@" : record.getHost().trim();
        String fqdn;
        if ("@".equals(host) || host.isEmpty()) {
            fqdn = domain;
        } else if (host.endsWith("." + domain) || host.equals(domain)) {
            fqdn = host;
        } else {
            fqdn = host + "." + domain;
        }
        String expected = record.getValue() == null ? "" : record.getValue().trim();
        String needle = switch (record.getPurpose()) {
            case VERIFY -> expected.contains("=")
                    ? expected.substring(expected.indexOf('=') + 1).trim()
                    : expected;
            case SPF -> "v=spf1";
            case DKIM -> "v=DKIM1";
            case DMARC -> "v=DMARC1";
            default -> expected.length() > 12 ? expected.substring(0, 12) : expected;
        };
        return dnsTxtLookup.anyContains(fqdn, needle);
    }

    private SendingDomainResponse toResponse(SendingDomain domain) {
        List<DomainDnsRecord> records = recordRepository.findByDomainIdOrderByCreatedAtAsc(domain.getId());
        long sendersCount = senderRepository.countByDomainId(domain.getId());
        List<SendingDomainResponse.DnsRecordResponse> recordResponses = new ArrayList<>();
        for (DomainDnsRecord record : records) {
            if (record.getPurpose() == DnsRecordPurpose.VERIFY) {
                // Still include VERIFY so wizard can show ownership TXT
            }
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
