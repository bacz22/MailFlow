package com.mailflow.emailsender;

import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.emailsender.api.request.CreateEmailSenderRequest;
import com.mailflow.emailsender.application.EmailSenderIdentityService;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.sendingdomain.domain.repository.SendingDomainRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailSenderIdentityServiceTest {

    @Mock EmailSenderIdentityRepository senderRepository;
    @Mock SendingDomainRepository domainRepository;
    @Mock CampaignRepository campaignRepository;
    @Mock WorkspaceAccessService accessService;
    @InjectMocks EmailSenderIdentityService senderService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesActiveSenderPendingDomain() {
        when(accessService.requireSenderWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(senderRepository.existsByWorkspaceIdAndEmailIgnoreCase(workspaceId, "news@acme.vn")).thenReturn(false);
        when(senderRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspaceId)).thenReturn(List.of());
        when(domainRepository.findByWorkspaceIdAndDomainIgnoreCase(workspaceId, "acme.vn"))
                .thenReturn(Optional.empty());
        when(senderRepository.save(any(EmailSenderIdentity.class))).thenAnswer(invocation -> {
            EmailSenderIdentity sender = invocation.getArgument(0);
            sender.setId(UUID.randomUUID());
            return sender;
        });

        var response = senderService.create(userId, workspaceId, CreateEmailSenderRequest.builder()
                .name("News")
                .email("News@Acme.vn")
                .build());

        assertThat(response.getEmail()).isEqualTo("news@acme.vn");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.isVerified()).isFalse();
        assertThat(response.isDefault()).isTrue();
        ArgumentCaptor<EmailSenderIdentity> captor = ArgumentCaptor.forClass(EmailSenderIdentity.class);
        verify(senderRepository).save(captor.capture());
        assertThat(captor.getValue().getWorkspaceId()).isEqualTo(workspaceId);
    }

    @Test
    void create_rejectsDuplicateEmail() {
        when(accessService.requireSenderWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(senderRepository.existsByWorkspaceIdAndEmailIgnoreCase(workspaceId, "news@acme.vn")).thenReturn(true);

        assertThatThrownBy(() -> senderService.create(userId, workspaceId, CreateEmailSenderRequest.builder()
                .name("News")
                .email("news@acme.vn")
                .build()))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void delete_rejectsWhenCampaignReferencesSender() {
        UUID senderId = UUID.randomUUID();
        EmailSenderIdentity sender = new EmailSenderIdentity(workspaceId, "News", "news@acme.vn", true);
        sender.setId(senderId);
        when(accessService.requireSenderWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(senderRepository.findByIdAndWorkspaceId(senderId, workspaceId)).thenReturn(Optional.of(sender));
        when(campaignRepository.existsByWorkspaceIdAndSenderId(workspaceId, senderId)).thenReturn(true);

        assertThatThrownBy(() -> senderService.delete(userId, workspaceId, senderId))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }
}
