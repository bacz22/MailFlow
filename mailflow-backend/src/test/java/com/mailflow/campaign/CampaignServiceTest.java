package com.mailflow.campaign;

import com.mailflow.audiencelist.domain.repository.AudienceListMemberRepository;
import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
import com.mailflow.audiencesegment.application.SegmentMatchQueryService;
import com.mailflow.audiencesegment.domain.repository.AudienceSegmentRepository;
import com.mailflow.campaign.api.request.ReviewCampaignRequest;
import com.mailflow.campaign.api.request.UpsertCampaignRequest;
import com.mailflow.campaign.application.CampaignAudienceResolver;
import com.mailflow.campaign.application.CampaignSendProcessor;
import com.mailflow.campaign.application.CampaignService;
import com.mailflow.campaign.domain.model.Campaign;
import com.mailflow.campaign.domain.model.CampaignStatus;
import com.mailflow.campaign.domain.repository.CampaignRecipientRepository;
import com.mailflow.campaign.domain.repository.CampaignRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.contact.domain.model.Contact;
import com.mailflow.contact.domain.model.ContactStatus;
import com.mailflow.emailsender.domain.model.EmailSenderIdentity;
import com.mailflow.emailsender.domain.repository.EmailSenderIdentityRepository;
import com.mailflow.emailtemplate.domain.repository.EmailTemplateRepository;
import com.mailflow.infrastructure.mail.EmailSender;
import com.mailflow.user.domain.repository.UserRepository;
import com.mailflow.workspace.application.WorkspaceAccessService;
import com.mailflow.workspace.domain.model.WorkspaceMember;
import com.mailflow.workspace.domain.model.WorkspaceRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock CampaignRepository campaignRepository;
    @Mock CampaignRecipientRepository recipientRepository;
    @Mock CampaignAudienceResolver audienceResolver;
    @Mock CampaignSendProcessor sendProcessor;
    @Mock EmailSenderIdentityRepository senderRepository;
    @Mock EmailTemplateRepository templateRepository;
    @Mock AudienceListRepository audienceListRepository;
    @Mock AudienceListMemberRepository audienceListMemberRepository;
    @Mock AudienceSegmentRepository audienceSegmentRepository;
    @Mock SegmentMatchQueryService matchQueryService;
    @Mock UserRepository userRepository;
    @Mock WorkspaceAccessService accessService;
    @Mock EmailSender emailSender;
    @InjectMocks CampaignService campaignService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesDraft() {
        when(accessService.requireCampaignWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> {
            Campaign campaign = invocation.getArgument(0);
            campaign.setId(UUID.randomUUID());
            return campaign;
        });
        when(userRepository.findAllById(any())).thenReturn(List.of());

        var response = campaignService.create(userId, workspaceId, UpsertCampaignRequest.builder()
                .name("Q3 Launch")
                .subject("Hello {{firstName}}")
                .htmlContent("<p>Hi</p>")
                .sendType("immediate")
                .build());

        assertThat(response.getName()).isEqualTo("Q3 Launch");
        assertThat(response.getStatus()).isEqualTo("DRAFT");
        assertThat(response.getSentCount()).isZero();
    }

    @Test
    void submit_requiresSenderAndAudience() {
        UUID campaignId = UUID.randomUUID();
        Campaign campaign = new Campaign(workspaceId, "Q3", "Hi", userId);
        campaign.setId(campaignId);
        campaign.setHtmlContent("<p>Hi</p>");
        when(accessService.requireCampaignWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.CAMPAIGN_EDITOR));
        when(campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)).thenReturn(Optional.of(campaign));

        assertThatThrownBy(() -> campaignService.submit(userId, workspaceId, campaignId))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void approve_immediate_startsSending() {
        UUID campaignId = UUID.randomUUID();
        UUID senderId = UUID.randomUUID();
        UUID listId = UUID.randomUUID();
        UUID contactId = UUID.randomUUID();
        Campaign campaign = new Campaign(workspaceId, "Q3", "Hi", userId);
        campaign.setId(campaignId);
        campaign.setStatus(CampaignStatus.PENDING_APPROVAL);
        campaign.setSenderId(senderId);
        campaign.setHtmlContent("<p>Hi</p>");
        campaign.setListIds(new UUID[]{listId});
        EmailSenderIdentity sender = new EmailSenderIdentity(workspaceId, "News", "news@acme.vn", true);
        sender.setId(senderId);
        Contact contact = new Contact(workspaceId, "a@acme.vn", "An", "Nguyen");
        contact.setId(contactId);
        contact.setStatus(ContactStatus.ACTIVE);
        when(accessService.requireCampaignApprove(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.ADMIN));
        when(campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)).thenReturn(Optional.of(campaign));
        when(senderRepository.findByIdAndWorkspaceId(senderId, workspaceId)).thenReturn(Optional.of(sender));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(recipientRepository.existsByCampaignId(campaignId)).thenReturn(false);
        when(audienceResolver.resolveActiveRecipients(any(Campaign.class))).thenReturn(List.of(contact));
        when(recipientRepository.saveAll(anyCollection())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findAllById(any())).thenReturn(List.of());
        when(senderRepository.findAllById(any())).thenReturn(List.of(sender));

        var response = campaignService.approve(userId, workspaceId, campaignId, new ReviewCampaignRequest("ok"));

        assertThat(response.getStatus()).isEqualTo("SENDING");
        assertThat(response.getRecipientCount()).isEqualTo(1);
    }

    @Test
    void delete_rejectsApproved() {
        UUID campaignId = UUID.randomUUID();
        Campaign campaign = new Campaign(workspaceId, "Q3", "Hi", userId);
        campaign.setId(campaignId);
        campaign.setStatus(CampaignStatus.APPROVED);
        when(accessService.requireCampaignDelete(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)).thenReturn(Optional.of(campaign));

        assertThatThrownBy(() -> campaignService.delete(userId, workspaceId, campaignId))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void pause_fromSending() {
        UUID campaignId = UUID.randomUUID();
        Campaign campaign = new Campaign(workspaceId, "Q3", "Hi", userId);
        campaign.setId(campaignId);
        campaign.setStatus(CampaignStatus.SENDING);
        when(accessService.requireCampaignSend(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.ADMIN));
        when(campaignRepository.findByIdAndWorkspaceId(campaignId, workspaceId)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findAllById(any())).thenReturn(List.of());

        var response = campaignService.pause(userId, workspaceId, campaignId);

        assertThat(response.getStatus()).isEqualTo("PAUSED");
    }
}
