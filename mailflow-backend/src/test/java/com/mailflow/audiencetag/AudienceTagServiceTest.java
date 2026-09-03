package com.mailflow.audiencetag;

import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
import com.mailflow.audiencetag.api.request.CreateAudienceTagRequest;
import com.mailflow.audiencetag.api.request.UpdateAudienceTagRequest;
import com.mailflow.audiencetag.application.AudienceTagService;
import com.mailflow.audiencetag.domain.model.AudienceTag;
import com.mailflow.audiencetag.domain.repository.AudienceTagRepository;
import com.mailflow.common.exception.AppException;
import com.mailflow.contact.domain.repository.ContactRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AudienceTagServiceTest {

    @Mock AudienceTagRepository tagRepository;
    @Mock ContactRepository contactRepository;
    @Mock AudienceListRepository listRepository;
    @Mock WorkspaceAccessService accessService;
    @InjectMocks AudienceTagService audienceTagService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesTagWhenNameIsAvailable() {
        when(accessService.requireTagWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(tagRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "Lead")).thenReturn(false);
        when(tagRepository.save(any(AudienceTag.class))).thenAnswer(invocation -> {
            AudienceTag tag = invocation.getArgument(0);
            tag.setId(UUID.randomUUID());
            return tag;
        });
        when(contactRepository.countByWorkspaceIdAndTag(eq(workspaceId), eq("Lead"))).thenReturn(0L);

        var response = audienceTagService.create(userId, workspaceId, CreateAudienceTagRequest.builder()
                .name("#Lead")
                .color("bg-emerald-50 text-emerald-700")
                .build());

        assertThat(response.getName()).isEqualTo("Lead");
        ArgumentCaptor<AudienceTag> captor = ArgumentCaptor.forClass(AudienceTag.class);
        verify(tagRepository).save(captor.capture());
        assertThat(captor.getValue().getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(captor.getValue().getColor()).contains("emerald");
    }

    @Test
    void create_rejectsDuplicateName() {
        when(accessService.requireTagWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(tagRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "Lead")).thenReturn(true);

        assertThatThrownBy(() -> audienceTagService.create(userId, workspaceId, CreateAudienceTagRequest.builder()
                .name("Lead")
                .build()))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("TAG_NAME_EXISTS");
    }

    @Test
    void update_renamesTagAcrossContactsAndLists() {
        UUID tagId = UUID.randomUUID();
        AudienceTag tag = new AudienceTag(workspaceId, "Lead", AudienceTag.DEFAULT_COLOR);
        tag.setId(tagId);
        when(accessService.requireTagWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(tagRepository.findByIdAndWorkspaceId(tagId, workspaceId)).thenReturn(Optional.of(tag));
        when(tagRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP")).thenReturn(false);
        when(contactRepository.countByWorkspaceIdAndTag(workspaceId, "VIP")).thenReturn(3L);

        var response = audienceTagService.update(userId, workspaceId, tagId, UpdateAudienceTagRequest.builder()
                .name("VIP")
                .build());

        assertThat(response.getName()).isEqualTo("VIP");
        assertThat(response.getContactCount()).isEqualTo(3L);
        verify(contactRepository).renameTagInWorkspace(workspaceId, "Lead", "VIP");
        verify(listRepository).renameTagInWorkspace(workspaceId, "Lead", "VIP");
    }

    @Test
    void delete_removesTagFromContactsAndCatalog() {
        UUID tagId = UUID.randomUUID();
        AudienceTag tag = new AudienceTag(workspaceId, "Lead", AudienceTag.DEFAULT_COLOR);
        tag.setId(tagId);
        when(accessService.requireTagDelete(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(tagRepository.findByIdAndWorkspaceId(tagId, workspaceId)).thenReturn(Optional.of(tag));

        audienceTagService.delete(userId, workspaceId, tagId);

        verify(contactRepository).removeTagFromWorkspace(workspaceId, "Lead");
        verify(listRepository).removeTagFromWorkspace(workspaceId, "Lead");
        verify(tagRepository).delete(tag);
    }

    @Test
    void syncFromContacts_createsMissingCatalogRows() {
        when(accessService.requireTagWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(accessService.requireTagRead(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(tagRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId))
                .thenReturn(List.of(new AudienceTag(workspaceId, "Lead", AudienceTag.DEFAULT_COLOR)))
                .thenReturn(List.of(
                        new AudienceTag(workspaceId, "Lead", AudienceTag.DEFAULT_COLOR),
                        new AudienceTag(workspaceId, "test", AudienceTag.DEFAULT_COLOR)
                ));
        when(contactRepository.findDistinctTags(workspaceId)).thenReturn(List.of("Lead", "test"));
        when(tagRepository.save(any(AudienceTag.class))).thenAnswer(invocation -> {
            AudienceTag tag = invocation.getArgument(0);
            tag.setId(UUID.randomUUID());
            return tag;
        });
        when(contactRepository.countByWorkspaceIdAndTag(any(), any())).thenReturn(1L);

        var response = audienceTagService.syncFromContacts(userId, workspaceId);

        assertThat(response.getCreated()).isEqualTo(1);
        verify(tagRepository).save(any(AudienceTag.class));
        ArgumentCaptor<AudienceTag> captor = ArgumentCaptor.forClass(AudienceTag.class);
        verify(tagRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("test");
    }

    @Test
    void syncFromContacts_skipsExisting() {
        when(accessService.requireTagWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(accessService.requireTagRead(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        AudienceTag existing = new AudienceTag(workspaceId, "Lead", AudienceTag.DEFAULT_COLOR);
        existing.setId(UUID.randomUUID());
        when(tagRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)).thenReturn(List.of(existing));
        when(contactRepository.findDistinctTags(workspaceId)).thenReturn(List.of("Lead"));
        when(contactRepository.countByWorkspaceIdAndTag(workspaceId, "Lead")).thenReturn(2L);

        var response = audienceTagService.syncFromContacts(userId, workspaceId);

        assertThat(response.getCreated()).isZero();
        verify(tagRepository, never()).save(any());
    }
}
