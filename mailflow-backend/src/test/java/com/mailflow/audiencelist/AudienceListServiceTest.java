package com.mailflow.audiencelist;

import com.mailflow.audiencelist.api.request.CreateAudienceListRequest;
import com.mailflow.audiencelist.application.AudienceListService;
import com.mailflow.audiencelist.domain.model.AudienceList;
import com.mailflow.audiencelist.domain.repository.AudienceListMemberRepository;
import com.mailflow.audiencelist.domain.repository.AudienceListRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AudienceListServiceTest {

    @Mock AudienceListRepository listRepository;
    @Mock AudienceListMemberRepository memberRepository;
    @Mock ContactRepository contactRepository;
    @Mock WorkspaceAccessService accessService;
    @InjectMocks AudienceListService audienceListService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesListWhenNameIsAvailable() {
        when(accessService.requireListWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP")).thenReturn(false);
        when(listRepository.save(any(AudienceList.class))).thenAnswer(invocation -> {
            AudienceList list = invocation.getArgument(0);
            list.setId(UUID.randomUUID());
            return list;
        });

        var response = audienceListService.create(userId, workspaceId, CreateAudienceListRequest.builder()
                .name("VIP")
                .description("Khách hàng trọng điểm")
                .build());

        assertThat(response.getName()).isEqualTo("VIP");
        assertThat(response.getContactCount()).isZero();
        ArgumentCaptor<AudienceList> captor = ArgumentCaptor.forClass(AudienceList.class);
        verify(listRepository).save(captor.capture());
        assertThat(captor.getValue().getWorkspaceId()).isEqualTo(workspaceId);
    }

    @Test
    void create_rejectsDuplicateNameInSameWorkspace() {
        when(accessService.requireListWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP")).thenReturn(true);

        assertThatThrownBy(() -> audienceListService.create(userId, workspaceId, CreateAudienceListRequest.builder()
                .name("VIP")
                .build()))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("LIST_NAME_EXISTS");
    }

    @Test
    void duplicate_copiesNameAndMembership() {
        UUID sourceId = UUID.randomUUID();
        AudienceList source = new AudienceList(workspaceId, "VIP", "desc");
        source.setId(sourceId);
        when(accessService.requireListWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(listRepository.findByIdAndWorkspaceId(sourceId, workspaceId)).thenReturn(java.util.Optional.of(source));
        when(listRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP (Bản sao)")).thenReturn(false);
        when(listRepository.save(any(AudienceList.class))).thenAnswer(invocation -> {
            AudienceList list = invocation.getArgument(0);
            list.setId(UUID.randomUUID());
            return list;
        });
        when(memberRepository.findByListId(sourceId)).thenReturn(List.of());
        when(memberRepository.countMembersByListIds(any())).thenReturn(List.of());

        var response = audienceListService.duplicate(userId, workspaceId, sourceId);

        assertThat(response.getName()).isEqualTo("VIP (Bản sao)");
        verify(listRepository).save(any(AudienceList.class));
    }
}
