package com.mailflow.emailtemplate;

import com.mailflow.common.exception.AppException;
import com.mailflow.emailtemplate.api.request.CreateEmailTemplateRequest;
import com.mailflow.emailtemplate.api.request.SendTestEmailTemplateRequest;
import com.mailflow.emailtemplate.application.EmailTemplateService;
import com.mailflow.emailtemplate.domain.model.EmailTemplate;
import com.mailflow.emailtemplate.domain.model.EmailTemplateStatus;
import com.mailflow.emailtemplate.domain.repository.EmailTemplateRepository;
import com.mailflow.engagement.application.PublicTrackingUrls;
import com.mailflow.infrastructure.mail.EmailSender;
import com.mailflow.user.domain.repository.UserRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {

    @Mock EmailTemplateRepository templateRepository;
    @Mock UserRepository userRepository;
    @Mock WorkspaceAccessService accessService;
    @Mock EmailSender emailSender;
    @Mock PublicTrackingUrls trackingUrls;
    @InjectMocks EmailTemplateService emailTemplateService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesDraftWhenNameIsAvailable() {
        when(accessService.requireTemplateWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "Welcome")).thenReturn(false);
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> {
            EmailTemplate t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(userRepository.findAllById(any())).thenReturn(List.of());

        var response = emailTemplateService.create(userId, workspaceId, CreateEmailTemplateRequest.builder()
                .name("Welcome")
                .subject("Hi {{firstName}}")
                .category("Onboarding")
                .htmlContent("<p>Hello {{company}}</p>")
                .build());

        assertThat(response.getName()).isEqualTo("Welcome");
        assertThat(response.getStatus()).isEqualTo("draft");
        ArgumentCaptor<EmailTemplate> captor = ArgumentCaptor.forClass(EmailTemplate.class);
        verify(templateRepository).save(captor.capture());
        assertThat(captor.getValue().getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(captor.getValue().getStatus()).isEqualTo(EmailTemplateStatus.DRAFT);
    }

    @Test
    void create_rejectsDuplicateName() {
        when(accessService.requireTemplateWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "Welcome")).thenReturn(true);

        assertThatThrownBy(() -> emailTemplateService.create(userId, workspaceId, CreateEmailTemplateRequest.builder()
                .name("Welcome")
                .subject("Hi")
                .category("Newsletter")
                .htmlContent("<p>x</p>")
                .build()))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("TEMPLATE_NAME_EXISTS");
    }

    @Test
    void duplicate_copiesContentAsDraft() {
        UUID sourceId = UUID.randomUUID();
        EmailTemplate source = new EmailTemplate(
                workspaceId, "Welcome", "Hi", "pre", "Onboarding",
                EmailTemplateStatus.PUBLISHED, "<p>Hi {{firstName}}</p>", "bg-blue", "MailFlow Communication", "Hi", userId);
        source.setId(sourceId);

        when(accessService.requireTemplateWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.CAMPAIGN_EDITOR));
        when(templateRepository.findByIdAndWorkspaceId(sourceId, workspaceId)).thenReturn(Optional.of(source));
        when(templateRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "Welcome (Bản sao)"))
                .thenReturn(false);
        when(templateRepository.save(any(EmailTemplate.class))).thenAnswer(invocation -> {
            EmailTemplate t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(userRepository.findAllById(any())).thenReturn(List.of());

        var response = emailTemplateService.duplicate(userId, workspaceId, sourceId);

        assertThat(response.getName()).isEqualTo("Welcome (Bản sao)");
        assertThat(response.getStatus()).isEqualTo("draft");
        assertThat(response.getHtmlContent()).isEqualTo("<p>Hi {{firstName}}</p>");
    }

    @Test
    void sendTest_rendersMergeTagsAndDelegatesToSmtp() {
        UUID templateId = UUID.randomUUID();
        EmailTemplate source = new EmailTemplate(
                workspaceId, "Welcome", "Hi {{firstName}}", null, "Onboarding",
                EmailTemplateStatus.DRAFT, "<p>{{company}} {{email}}</p>", null, null, null, userId);
        source.setId(templateId);

        when(accessService.requireTemplateWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.ADMIN));
        when(templateRepository.findByIdAndWorkspaceId(templateId, workspaceId)).thenReturn(Optional.of(source));
        when(trackingUrls.unsubscribeUrl(eq(workspaceId), any(UUID.class), any(UUID.class)))
                .thenReturn("http://localhost:8080/t/unsubscribe?token=test");

        emailTemplateService.sendTest(userId, workspaceId, templateId, SendTestEmailTemplateRequest.builder()
                .to("qa@example.com")
                .firstName("An")
                .company("V-Corp")
                .build());

        ArgumentCaptor<String> htmlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailSender).sendHtmlEmail(eq("qa@example.com"), eq("[TEST] Hi An"), htmlCaptor.capture());
        assertThat(htmlCaptor.getValue()).contains("<p>V-Corp qa@example.com</p>");
        assertThat(htmlCaptor.getValue()).contains("linear-gradient");
        assertThat(htmlCaptor.getValue()).contains("/t/unsubscribe?token=test");
    }
}
