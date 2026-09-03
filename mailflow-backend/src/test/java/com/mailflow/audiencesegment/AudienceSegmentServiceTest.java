package com.mailflow.audiencesegment;

import com.mailflow.audiencelist.application.AudienceListService;
import com.mailflow.audiencesegment.api.request.CreateAudienceSegmentRequest;
import com.mailflow.audiencesegment.application.AudienceSegmentService;
import com.mailflow.audiencesegment.application.SegmentMatchQueryService;
import com.mailflow.audiencesegment.application.SegmentRuleEvaluator;
import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import com.mailflow.audiencesegment.domain.repository.AudienceSegmentRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AudienceSegmentServiceTest {

    @Mock AudienceSegmentRepository segmentRepository;
    @Mock SegmentMatchQueryService matchQueryService;
    @Mock SegmentRuleEvaluator ruleEvaluator;
    @Mock ContactRepository contactRepository;
    @Mock AudienceListService audienceListService;
    @Mock WorkspaceAccessService accessService;
    @InjectMocks AudienceSegmentService audienceSegmentService;

    private final UUID userId = UUID.randomUUID();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void create_savesSegmentWhenValid() {
        when(accessService.requireSegmentWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(segmentRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP HN")).thenReturn(false);
        when(segmentRepository.save(any(AudienceSegment.class))).thenAnswer(invocation -> {
            AudienceSegment segment = invocation.getArgument(0);
            segment.setId(UUID.randomUUID());
            return segment;
        });
        when(matchQueryService.count(eq(workspaceId), any(), any())).thenReturn(12L);

        var response = audienceSegmentService.create(userId, workspaceId, CreateAudienceSegmentRequest.builder()
                .name("VIP HN")
                .matchLogic("and")
                .conditions(List.of(new SegmentCondition("c1", "status", "equals", "active", "status")))
                .build());

        assertThat(response.getName()).isEqualTo("VIP HN");
        assertThat(response.getMatchLogic()).isEqualTo("and");
        assertThat(response.getContactCount()).isEqualTo(12L);
        verify(ruleEvaluator).validate(any());
        ArgumentCaptor<AudienceSegment> captor = ArgumentCaptor.forClass(AudienceSegment.class);
        verify(segmentRepository).save(captor.capture());
        assertThat(captor.getValue().getMatchLogic()).isEqualTo(AudienceSegment.MatchLogic.AND);
    }

    @Test
    void create_rejectsDuplicateName() {
        when(accessService.requireSegmentWrite(userId, workspaceId))
                .thenReturn(new WorkspaceMember(workspaceId, userId, WorkspaceRole.OWNER));
        when(segmentRepository.existsByWorkspaceIdAndNameIgnoreCase(workspaceId, "VIP HN")).thenReturn(true);

        assertThatThrownBy(() -> audienceSegmentService.create(userId, workspaceId, CreateAudienceSegmentRequest.builder()
                .name("VIP HN")
                .matchLogic("and")
                .conditions(List.of(new SegmentCondition("c1", "status", "equals", "active", "status")))
                .build()))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("SEGMENT_NAME_EXISTS");
    }
}
