package com.mailflow.audiencesegment.application;

import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import com.mailflow.common.exception.AppException;
import com.mailflow.contact.domain.model.ContactStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class SegmentRuleEvaluator {

    private static final Set<String> SUPPORTED_FIELDS = Set.of(
            "status", "tags", "company", "email", "created_at", "city", "job_title", "list_id"
    );

    public record BuiltQuery(String whereSql, Map<String, Object> params) {
    }

    public void validate(List<SegmentCondition> conditions) {
        if (conditions == null || conditions.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_CONDITIONS_REQUIRED",
                    "Phân đoạn cần ít nhất một điều kiện.");
        }
        for (SegmentCondition condition : conditions) {
            if (condition == null || condition.getField() == null || condition.getOperator() == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_CONDITION_INVALID",
                        "Điều kiện phân đoạn không hợp lệ.");
            }
            String field = condition.getField().trim().toLowerCase(Locale.ROOT);
            if ("engagement_score".equals(field)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_FIELD_UNSUPPORTED",
                        "Trường engagement_score chưa được hỗ trợ.");
            }
            if (!SUPPORTED_FIELDS.contains(field)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_FIELD_UNSUPPORTED",
                        "Trường \"" + condition.getField() + "\" chưa được hỗ trợ.");
            }
            if (condition.getValue() == null || condition.getValue().isBlank()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_VALUE_REQUIRED",
                        "Vui lòng nhập giá trị cho điều kiện.");
            }
            buildPredicate(field, condition.getOperator(), condition.getValue().trim(), "v0");
        }
    }

    public BuiltQuery build(
            UUID workspaceId,
            AudienceSegment.MatchLogic matchLogic,
            List<SegmentCondition> conditions
    ) {
        validate(conditions);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("workspaceId", workspaceId);
        List<String> parts = new ArrayList<>();
        int idx = 0;
        for (SegmentCondition condition : conditions) {
            String field = condition.getField().trim().toLowerCase(Locale.ROOT);
            String paramKey = "v" + idx++;
            parts.add(buildPredicate(field, condition.getOperator(), condition.getValue().trim(), paramKey, params));
        }
        String joiner = matchLogic == AudienceSegment.MatchLogic.OR ? " OR " : " AND ";
        String where = "c.workspace_id = :workspaceId AND (" + String.join(joiner, parts) + ")";
        return new BuiltQuery(where, params);
    }

    private String buildPredicate(String field, String operator, String value, String paramKey) {
        Map<String, Object> discard = new LinkedHashMap<>();
        return buildPredicate(field, operator, value, paramKey, discard);
    }

    private String buildPredicate(
            String field,
            String operator,
            String value,
            String paramKey,
            Map<String, Object> params
    ) {
        String op = operator.trim().toLowerCase(Locale.ROOT);
        return switch (field) {
            case "status" -> statusPredicate(op, value, paramKey, params);
            case "tags" -> tagsPredicate(op, value, paramKey, params);
            case "company" -> textPredicate("LOWER(COALESCE(c.company, ''))", op, value, paramKey, params);
            case "email" -> textPredicate("LOWER(c.email)", op, value, paramKey, params);
            case "created_at" -> datePredicate(op, value, paramKey, params);
            case "city" -> customFieldPredicate("city", op, value, paramKey, params);
            case "job_title" -> customFieldPredicate("job_title", op, value, paramKey, params);
            case "list_id" -> listPredicate(op, value, paramKey, params);
            default -> throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_FIELD_UNSUPPORTED",
                    "Trường \"" + field + "\" chưa được hỗ trợ.");
        };
    }

    private String statusPredicate(String op, String value, String paramKey, Map<String, Object> params) {
        ContactStatus status;
        try {
            status = ContactStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_VALUE_INVALID",
                    "Trạng thái liên hệ không hợp lệ.");
        }
        params.put(paramKey, status.name());
        return switch (op) {
            case "equals" -> "c.status = :" + paramKey;
            case "not_equals" -> "c.status <> :" + paramKey;
            default -> unsupportedOperator("status", op);
        };
    }

    private String tagsPredicate(String op, String value, String paramKey, Map<String, Object> params) {
        params.put(paramKey, value);
        return switch (op) {
            case "contains" -> ":" + paramKey + " = ANY (c.tags)";
            case "not_contains" -> "NOT (:" + paramKey + " = ANY (c.tags))";
            default -> unsupportedOperator("tags", op);
        };
    }

    private String textPredicate(
            String columnExpr,
            String op,
            String value,
            String paramKey,
            Map<String, Object> params
    ) {
        String lower = value.toLowerCase(Locale.ROOT);
        return switch (op) {
            case "equals" -> {
                params.put(paramKey, lower);
                yield columnExpr + " = :" + paramKey;
            }
            case "contains" -> {
                params.put(paramKey, "%" + escapeLike(lower) + "%");
                yield columnExpr + " LIKE :" + paramKey;
            }
            case "starts_with" -> {
                params.put(paramKey, escapeLike(lower) + "%");
                yield columnExpr + " LIKE :" + paramKey;
            }
            default -> unsupportedOperator("text", op);
        };
    }

    private String datePredicate(String op, String value, String paramKey, Map<String, Object> params) {
        return switch (op) {
            case "in_the_last_days" -> {
                int days;
                try {
                    days = Integer.parseInt(value);
                } catch (NumberFormatException ex) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_VALUE_INVALID",
                            "Số ngày không hợp lệ.");
                }
                if (days < 0 || days > 3650) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_VALUE_INVALID",
                            "Số ngày phải từ 0 đến 3650.");
                }
                params.put(paramKey, days);
                yield "c.created_at >= (CURRENT_TIMESTAMP - (:" + paramKey + " * INTERVAL '1 day'))";
            }
            case "after" -> {
                params.put(paramKey, parseInstantDate(value));
                yield "c.created_at > CAST(:" + paramKey + " AS timestamptz)";
            }
            case "before" -> {
                params.put(paramKey, parseInstantDate(value));
                yield "c.created_at < CAST(:" + paramKey + " AS timestamptz)";
            }
            default -> unsupportedOperator("created_at", op);
        };
    }

    private String customFieldPredicate(
            String key,
            String op,
            String value,
            String paramKey,
            Map<String, Object> params
    ) {
        String keyParam = paramKey + "k";
        params.put(keyParam, key.toLowerCase(Locale.ROOT));
        String lower = value.toLowerCase(Locale.ROOT);
        String comparison = switch (op) {
            case "equals" -> {
                params.put(paramKey, lower);
                yield "LOWER(elem->>'value') = :" + paramKey;
            }
            case "contains" -> {
                params.put(paramKey, "%" + escapeLike(lower) + "%");
                yield "LOWER(elem->>'value') LIKE :" + paramKey;
            }
            default -> unsupportedOperator(key, op);
        };
        return """
                EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements(COALESCE(c.custom_fields, '[]'::jsonb)) AS elem
                  WHERE LOWER(elem->>'key') = :%s
                    AND %s
                )
                """.formatted(keyParam, comparison).trim();
    }

    private String listPredicate(String op, String value, String paramKey, Map<String, Object> params) {
        UUID listId;
        try {
            listId = UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_VALUE_INVALID",
                    "ID danh sách không hợp lệ.");
        }
        params.put(paramKey, listId);
        String exists = """
                EXISTS (
                  SELECT 1 FROM audience_list_members m
                  WHERE m.contact_id = c.id AND m.list_id = :%s
                )
                """.formatted(paramKey).trim();
        return switch (op) {
            case "in", "equals" -> exists;
            case "not_in", "not_equals" -> "NOT " + exists;
            default -> unsupportedOperator("list_id", op);
        };
    }

    private String parseInstantDate(String value) {
        // Accept YYYY-MM-DD or full ISO; store as string for CAST.
        String trimmed = value.trim();
        if (trimmed.length() == 10) {
            return trimmed + "T00:00:00Z";
        }
        return trimmed;
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private String unsupportedOperator(String field, String op) {
        throw new AppException(HttpStatus.BAD_REQUEST, "SEGMENT_OPERATOR_UNSUPPORTED",
                "Toán tử \"" + op + "\" không hỗ trợ cho trường " + field + ".");
    }
}
