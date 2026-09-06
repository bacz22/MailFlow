package com.mailflow.emailtemplate.application;

import com.mailflow.common.exception.AppException;
import com.mailflow.common.exception.ResourceNotFoundException;
import com.mailflow.emailtemplate.api.request.CreateEmailTemplateRequest;
import com.mailflow.emailtemplate.api.request.SendTestEmailTemplateRequest;
import com.mailflow.emailtemplate.api.request.UpdateEmailTemplateRequest;
import com.mailflow.emailtemplate.api.response.EmailTemplateResponse;
import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.model.EmailTemplateStatus;
import com.mailflow.emailtemplate.domain.repository.EmailTemplateRepository;
import com.mailflow.engagement.application.PublicTrackingUrls;
import com.mailflow.infrastructure.mail.EmailSender;
import com.mailflow.user.domain.model.User;
import com.mailflow.user.domain.repository.UserRepository;
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
public class EmailTemplateService {

    private static final Set<String> CATEGORIES = Set.of(
            "Newsletter", "Product", "Onboarding", "Promotional", "Transactional");

    private final EmailTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final WorkspaceAccessService accessService;
    private final EmailSender emailSender;
    private final PublicTrackingUrls trackingUrls;

    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> list(
            UUID userId,
            UUID workspaceId,
            String q,
            String status,
            String category
    ) {
        accessService.requireTemplateRead(userId, workspaceId);
        String like = toLike(q);
        EmailTemplateStatus statusFilter = parseOptionalStatus(status);
        String categoryFilter = parseOptionalCategory(category);
        List<EmailTemplate> templates = templateRepository.search(workspaceId, like, statusFilter, categoryFilter);
        Map<UUID, String> creators = loadCreatorNames(templates);
        return templates.stream().map(t -> toResponse(t, creators)).toList();
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse get(UUID userId, UUID workspaceId, UUID templateId) {
        accessService.requireTemplateRead(userId, workspaceId);
        EmailTemplate template = requireTemplate(workspaceId, templateId);
        return toResponse(template, loadCreatorNames(List.of(template)));
    }

    @Transactional
    public EmailTemplateResponse create(UUID userId, UUID workspaceId, CreateEmailTemplateRequest request) {
        accessService.requireTemplateWrite(userId, workspaceId);
        String name = requireName(request.getName());
        assertNameAvailable(workspaceId, name, null);
        String subject = requireSubject(request.getSubject());
        String html = requireHtml(request.getHtmlContent());
        String category = requireCategory(request.getCategory());
        EmailTemplateStatus status = parseStatusOrDefault(request.getStatus());
        String preview = blankToNull(request.getPreviewText());
        String thumb = blankToNull(request.getThumbnailGradient());
        String banner = request.getBannerLabel() == null || request.getBannerLabel().isBlank()
                ? EmailTemplate.DEFAULT_BANNER_LABEL
                : request.getBannerLabel().trim();
        String bannerTitle = request.getBannerTitle() == null || request.getBannerTitle().isBlank()
                ? subject
                : request.getBannerTitle().trim();

        EmailTemplate template = new EmailTemplate(
                workspaceId, name, subject, preview, category, status, html, thumb, banner, bannerTitle, userId);
        template = templateRepository.save(template);
        return toResponse(template, loadCreatorNames(List.of(template)));
    }

    @Transactional
    public EmailTemplateResponse update(
            UUID userId,
            UUID workspaceId,
            UUID templateId,
            UpdateEmailTemplateRequest request
    ) {
        accessService.requireTemplateWrite(userId, workspaceId);
        EmailTemplate template = requireTemplate(workspaceId, templateId);

        String name = template.getName();
        if (request.getName() != null) {
            name = requireName(request.getName());
            assertNameAvailable(workspaceId, name, template.getId());
        }
        String subject = request.getSubject() == null ? template.getSubject() : requireSubject(request.getSubject());
        String html = request.getHtmlContent() == null ? template.getHtmlContent() : requireHtml(request.getHtmlContent());
        String category = request.getCategory() == null ? template.getCategory() : requireCategory(request.getCategory());
        EmailTemplateStatus status = request.getStatus() == null
                ? template.getStatus()
                : parseStatusOrDefault(request.getStatus());
        String preview = request.getPreviewText() == null ? template.getPreviewText() : blankToNull(request.getPreviewText());
        String thumb = request.getThumbnailGradient() == null
                ? template.getThumbnailGradient()
                : blankToNull(request.getThumbnailGradient());
        String banner = request.getBannerLabel() == null
                ? template.getBannerLabel()
                : blankToNull(request.getBannerLabel());
        String bannerTitle = request.getBannerTitle() == null
                ? template.getBannerTitle()
                : blankToNull(request.getBannerTitle());

        template.apply(name, subject, preview, category, status, html, thumb, banner, bannerTitle);
        template = templateRepository.save(template);
        return toResponse(template, loadCreatorNames(List.of(template)));
    }

    @Transactional
    public void delete(UUID userId, UUID workspaceId, UUID templateId) {
        accessService.requireTemplateDelete(userId, workspaceId);
        EmailTemplate template = requireTemplate(workspaceId, templateId);
        templateRepository.delete(template);
    }

    @Transactional
    public EmailTemplateResponse duplicate(UUID userId, UUID workspaceId, UUID templateId) {
        accessService.requireTemplateWrite(userId, workspaceId);
        EmailTemplate source = requireTemplate(workspaceId, templateId);
        String copyName = uniqueCopyName(workspaceId, source.getName());
        EmailTemplate copy = new EmailTemplate(
                workspaceId,
                copyName,
                source.getSubject(),
                source.getPreviewText(),
                source.getCategory(),
                EmailTemplateStatus.DRAFT,
                source.getHtmlContent(),
                source.getThumbnailGradient(),
                source.getBannerLabel(),
                source.getBannerTitle(),
                userId
        );
        copy = templateRepository.save(copy);
        return toResponse(copy, loadCreatorNames(List.of(copy)));
    }

    @Transactional(readOnly = true)
    public void sendTest(
            UUID userId,
            UUID workspaceId,
            UUID templateId,
            SendTestEmailTemplateRequest request
    ) {
        accessService.requireTemplateWrite(userId, workspaceId);
        EmailTemplate template = requireTemplate(workspaceId, templateId);
        String to = request.getTo() == null ? "" : request.getTo().trim().toLowerCase(Locale.ROOT);
        UUID testContactId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        UUID testCampaignId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        String unsubscribeUrl = trackingUrls.unsubscribeUrl(workspaceId, testCampaignId, testContactId);
        String subject = "[TEST] " + EmailTemplateMerge.applySubject(
                template.getSubject(),
                request.getFirstName(),
                request.getLastName(),
                to,
                request.getCompany()
        );
        String body = EmailTemplateMerge.applyHtml(
                template.getHtmlContent(),
                request.getFirstName(),
                request.getLastName(),
                to,
                request.getCompany(),
                request.getPhone(),
                unsubscribeUrl
        );
        emailSender.sendHtmlEmail(to, subject, EmailTemplateLayout.wrap(template, body, unsubscribeUrl));
    }

    private EmailTemplate requireTemplate(UUID workspaceId, UUID templateId) {
        return templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Mẫu email", templateId.toString()));
    }

    private void assertNameAvailable(UUID workspaceId, String name, UUID excludeId) {
        boolean exists = excludeId == null
                ? templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, name)
                : templateRepository.existsByWorkspaceIdAndNameIgnoreCaseAndIdNot(workspaceId, name, excludeId);
        if (exists) {
            throw new AppException(HttpStatus.CONFLICT, "TEMPLATE_NAME_EXISTS",
                    "Tên mẫu đã tồn tại trong workspace.");
        }
    }

    private String uniqueCopyName(UUID workspaceId, String sourceName) {
        String first = sourceName + " (Bản sao)";
        if (!templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, first)) {
            return first;
        }
        int n = 2;
        String candidate;
        do {
            candidate = sourceName + " (Bản sao " + n + ")";
            n++;
        } while (templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, candidate));
        return candidate;
    }

    private static String requireName(String raw) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_NAME_REQUIRED", "Vui lòng nhập tên mẫu.");
        }
        return name;
    }

    private static String requireSubject(String raw) {
        String subject = raw == null ? "" : raw.trim();
        if (subject.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_SUBJECT_REQUIRED", "Vui lòng nhập tiêu đề email.");
        }
        return subject;
    }

    private static String requireHtml(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_HTML_REQUIRED", "Nội dung email không được để trống.");
        }
        return raw;
    }

    private static String requireCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_CATEGORY_INVALID", "Phân loại không hợp lệ.");
        }
        String category = raw.trim();
        if (!CATEGORIES.contains(category)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_CATEGORY_INVALID",
                    "Phân loại phải là Newsletter, Product, Onboarding, Promotional hoặc Transactional.");
        }
        return category;
    }

    private static String parseOptionalCategory(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return "";
        }
        return requireCategory(raw);
    }

    private static EmailTemplateStatus parseOptionalStatus(String raw) {
        if (raw == null || raw.isBlank() || "all".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        return parseStatusOrDefault(raw);
    }

    private static EmailTemplateStatus parseStatusOrDefault(String raw) {
        if (raw == null || raw.isBlank()) {
            return EmailTemplateStatus.DRAFT;
        }
        try {
            return EmailTemplateStatus.fromApi(raw);
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "TEMPLATE_STATUS_INVALID",
                    "Trạng thái phải là draft, published hoặc archived.");
        }
    }

    private static String toLike(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        return "%" + q.trim().toLowerCase(Locale.ROOT).replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Map<UUID, String> loadCreatorNames(List<EmailTemplate> templates) {
        Set<UUID> ids = new HashSet<>();
        for (EmailTemplate template : templates) {
            if (template.getCreatedBy() != null) {
                ids.add(template.getCreatedBy());
            }
        }
        Map<UUID, String> names = new HashMap<>();
        if (ids.isEmpty()) {
            return names;
        }
        for (User user : userRepository.findAllById(ids)) {
            names.put(user.getId(), displayName(user));
        }
        return names;
    }

    private static String displayName(User user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return user.getEmail();
    }

    private EmailTemplateResponse toResponse(EmailTemplate template, Map<UUID, String> creators) {
        String createdBy = "—";
        if (template.getCreatedBy() != null) {
            createdBy = creators.getOrDefault(template.getCreatedBy(), "—");
        }
        return EmailTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .subject(template.getSubject())
                .previewText(template.getPreviewText())
                .category(template.getCategory())
                .status(template.getStatus() == null ? EmailTemplateStatus.DRAFT.toApi() : template.getStatus().toApi())
                .createdBy(createdBy)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .htmlContent(template.getHtmlContent())
                .thumbnailGradient(template.getThumbnailGradient())
                .bannerLabel(template.getBannerLabel())
                .bannerTitle(template.getBannerTitle())
                .build();
    }
}
