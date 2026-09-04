package com.mailflow.emailsender.application;

import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.emailsender.api.request.CreateEmailSenderRequest;
import com.mailflow.emailsender.api.request.UpdateEmailSenderRequest;
import com.mailflow.emailsender.api.response.EmailSenderResponse;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.model.EmailSenderStatus;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.sendingdomain.domain.model.SendingDomain;
import com.mailflow.sendingdomain.domain.model.SendingDomainStatus;
import com.mailflow.sendingdomain.domain.repository.SendingDomainRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailSenderIdentityService {

    private final EmailSenderIdentityRepository senderRepository;
    private final SendingDomainRepository domainRepository;
    private final CampaignRepository campaignRepository;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<EmailSenderResponse> list(UUID userId, UUID workspaceId, String q, String status) {
        accessService.requireSenderRead(userId, workspaceId);
        EmailSenderStatus statusFilter = parseOptionalStatus(status);
        String like = toLike(q);
        List<EmailSenderIdentity> senders = senderRepository.search(workspaceId, like, statusFilter);
        Map<UUID, SendingDomain> domains = loadDomains(senders);
        return senders.stream().map(s -> toResponse(s, domains)).toList();
    }

    @Transactional
    public EmailSenderResponse create(UUID userId, UUID workspaceId, CreateEmailSenderRequest request) {
        accessService.requireSenderWrite(userId, workspaceId);
        String email = EmailSenderIdentity.normalizeEmail(request.getEmail());
        if (email.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SENDER_EMAIL_REQUIRED", "Vui lòng nhập địa chỉ email.");
        }
        if (senderRepository.existsByWorkspaceIdAndEmailIgnoreCase(workspaceId, email)) {
            throw new AppException(HttpStatus.CONFLICT, "SENDER_EMAIL_EXISTS",
                    "Địa chỉ người gửi đã tồn tại trong workspace.");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SENDER_NAME_REQUIRED", "Vui lòng nhập tên người gửi.");
        }
        boolean makeDefault = senderRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspaceId).isEmpty();
        EmailSenderIdentity sender = new EmailSenderIdentity(workspaceId, name, email, makeDefault);
        sender.setDomainId(resolveDomainId(workspaceId, email, request.getDomainId()));
        sender = senderRepository.save(sender);
        return toResponse(sender, loadDomains(List.of(sender)));
    }

    @Transactional
    public EmailSenderResponse update(
            UUID userId,
            UUID workspaceId,
            UUID senderId,
            UpdateEmailSenderRequest request
    ) {
        accessService.requireSenderWrite(userId, workspaceId);
        EmailSenderIdentity sender = requireSender(workspaceId, senderId);
        EmailSenderStatus status = request.getStatus() == null
                ? sender.getStatus()
                : parseStatus(request.getStatus());
        sender.apply(request.getName(), status);
        if (request.getDomainId() != null) {
            sender.setDomainId(resolveDomainId(workspaceId, sender.getEmail(), request.getDomainId()));
        } else if (sender.getDomainId() == null) {
            sender.setDomainId(resolveDomainId(workspaceId, sender.getEmail(), null));
        }
        sender = senderRepository.save(sender);
        return toResponse(sender, loadDomains(List.of(sender)));
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID senderId) {
        accessService.requireSenderWrite(userId, workspaceId);
        EmailSenderIdentity sender = requireSender(workspaceId, senderId);
        if (campaignRepository.existsByWorkspaceIdAndSenderId(workspaceId, senderId)) {
            throw new AppException(HttpStatus.CONFLICT, "SENDER_IN_USE",
                    "Không thể xóa người gửi đang được dùng bởi chiến dịch.");
        }
        senderRepository.delete(sender);
    }

    @Transactional
    public EmailSenderResponse setDefault(UUID userId, UUID workspaceId, UUID senderId) {
        accessService.requireSenderWrite(userId, workspaceId);
        EmailSenderIdentity sender = requireSender(workspaceId, senderId);
        senderRepository.clearDefault(workspaceId);
        sender.setDefault(true);
        sender.setStatus(EmailSenderStatus.ACTIVE);
        sender = senderRepository.save(sender);
        return toResponse(sender, loadDomains(List.of(sender)));
    }

    public EmailSenderIdentity requireSender(UUID workspaceId, UUID senderId) {
        return senderRepository.findByIdAndWorkspaceId(senderId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Người gửi", senderId.toString()));
    }

    private UUID resolveDomainId(UUID workspaceId, String email, UUID requestedDomainId) {
        if (requestedDomainId != null) {
            SendingDomain domain = domainRepository.findByIdAndWorkspaceId(requestedDomainId, workspaceId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "DOMAIN_NOT_FOUND",
                            "Tên miền không tồn tại trong workspace."));
            String host = emailHost(email);
            if (!host.isEmpty() && !host.equalsIgnoreCase(domain.getDomain())
                    && !host.endsWith("." + domain.getDomain())) {
                throw new AppException(HttpStatus.BAD_REQUEST, "DOMAIN_EMAIL_MISMATCH",
                        "Email người gửi phải thuộc tên miền đã chọn.");
            }
            return domain.getId();
        }
        String host = emailHost(email);
        if (host.isEmpty()) {
            return null;
        }
        return domainRepository.findByWorkspaceIdAndDomainIgnoreCase(workspaceId, host)
                .map(SendingDomain::getId)
                .orElse(null);
    }

    private Map<UUID, SendingDomain> loadDomains(List<EmailSenderIdentity> senders) {
        Set<UUID> ids = new HashSet<>();
        for (EmailSenderIdentity sender : senders) {
            if (sender.getDomainId() != null) {
                ids.add(sender.getDomainId());
            }
        }
        Map<UUID, SendingDomain> map = new HashMap<>();
        if (ids.isEmpty()) {
            return map;
        }
        for (SendingDomain domain : domainRepository.findAllById(ids)) {
            map.put(domain.getId(), domain);
        }
        return map;
    }

    private EmailSenderStatus parseOptionalStatus(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        return parseStatus(raw);
    }

    private EmailSenderStatus parseStatus(String raw) {
        try {
            return EmailSenderStatus.fromApi(raw);
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SENDER_STATUS_INVALID",
                    "Trạng thái người gửi không hợp lệ.");
        }
    }

    private static String toLike(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        return "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static String emailHost(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }
        return email.substring(email.indexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
    }

    private EmailSenderResponse toResponse(EmailSenderIdentity sender, Map<UUID, SendingDomain> domains) {
        boolean active = sender.getStatus() == EmailSenderStatus.ACTIVE;
        String email = sender.getEmail() == null ? "" : sender.getEmail();
        String domainLabel = emailHost(email);
        SendingDomain linked = sender.getDomainId() == null ? null : domains.get(sender.getDomainId());
        boolean domainVerified = linked != null && linked.getStatus() == SendingDomainStatus.VERIFIED;
        String authStatus = domainVerified ? "verified" : (linked != null ? "pending" : "pending");
        if (linked != null && linked.getStatus() == SendingDomainStatus.FAILED) {
            authStatus = "failed";
        }
        return EmailSenderResponse.builder()
                .id(sender.getId())
                .name(sender.getName())
                .email(email)
                .domain(linked != null ? linked.getDomain() : domainLabel)
                .domainId(sender.getDomainId())
                .status(domainVerified && active ? "VERIFIED" : (active ? "PENDING" : "FAILED"))
                .isVerified(domainVerified && active)
                .isDefault(sender.isDefault())
                .dkimStatus(authStatus)
                .spfStatus(authStatus)
                .createdAt(sender.getCreatedAt())
                .build();
    }
}
