package com.mailflow.audiencesegment;

import com.mailflow.audiencesegment.application.SegmentRuleEvaluator;
import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import com.mailflow.common.exception.AppException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SegmentRuleEvaluatorTest {

    private final SegmentRuleEvaluator evaluator = new SegmentRuleEvaluator();
    private final UUID workspaceId = UUID.randomUUID();

    @Test
    void build_andLogicForStatusAndTags() {
        var built = evaluator.build(
                workspaceId,
                AudienceSegment.MatchLogic.AND,
                List.of(
                        new SegmentCondition("1", "status", "equals", "active", "status"),
                        new SegmentCondition("2", "tags", "contains", "VIP", "tag")
                )
        );

        assertThat(built.whereSql()).contains(" AND ");
        assertThat(built.whereSql()).contains("c.status = :v0");
        assertThat(built.whereSql()).contains(":v1 = ANY (c.tags)");
        assertThat(built.params()).containsEntry("v0", "ACTIVE");
        assertThat(built.params()).containsEntry("v1", "VIP");
    }

    @Test
    void build_rejectsEngagementScore() {
        assertThatThrownBy(() -> evaluator.validate(List.of(
                new SegmentCondition("1", "engagement_score", "greater_than", "80", "number")
        )))
                .isInstanceOf(AppException.class)
                .extracting("code")
                .isEqualTo("SEGMENT_FIELD_UNSUPPORTED");
    }

    @Test
    void build_listMembership() {
        UUID listId = UUID.randomUUID();
        var built = evaluator.build(
                workspaceId,
                AudienceSegment.MatchLogic.OR,
                List.of(new SegmentCondition("1", "list_id", "in", listId.toString(), "string"))
        );
        assertThat(built.whereSql()).contains("audience_list_members");
        assertThat(built.params()).containsEntry("v0", listId);
        assertThat(built.whereSql()).startsWith("c.workspace_id = :workspaceId AND (");
    }
}
