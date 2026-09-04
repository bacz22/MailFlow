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
import com.mailflow.workspace.application.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailSenderIdentityService {

    private final EmailSenderIdentityRepository senderRepository;
    private final CampaignRepository campaignRepository;
    private final WorkspaceAccessService accessService;

    @Transactional(readOnly = true)
    public List<EmailSenderResponse> list(UUID userId, UUID workspaceId, String q, String status) {
        accessService.requireSenderRead(userId, workspaceId);
        EmailSenderStatus statusFilter = parseOptionalStatus(status);
        String like = toLike(q);
        return senderRepository.search(workspaceId, like, statusFilter).stream()
                .map(this::toResponse)
                .toList();
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
        sender = senderRepository.save(sender);
        return toResponse(sender);
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
        return toResponse(senderRepository.save(sender));
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
        return toResponse(senderRepository.save(sender));
    }

    public EmailSenderIdentity requireSender(UUID workspaceId, UUID senderId) {
        return senderRepository.findByIdAndWorkspaceId(senderId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Người gửi", senderId.toString()));
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

    private EmailSenderResponse toResponse(EmailSenderIdentity sender) {
        boolean active = sender.getStatus() == EmailSenderStatus.ACTIVE;
        String email = sender.getEmail() == null ? "" : sender.getEmail();
        String domain = email.contains("@") ? email.substring(email.indexOf('@') + 1) : "";
        return EmailSenderResponse.builder()
                .id(sender.getId())
                .name(sender.getName())
                .email(email)
                .domain(domain)
                .status(active ? "VERIFIED" : "FAILED")
                .isVerified(active)
                .isDefault(sender.isDefault())
                .dkimStatus(active ? "verified" : "pending")
                .spfStatus(active ? "verified" : "pending")
                .createdAt(sender.getCreatedAt())
                .build();
    }
}
