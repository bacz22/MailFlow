package com.mailflow.audiencesegment.application;

import com.mailflow.audiencesegment.domain.model.AudienceSegment;
import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import com.mailflow.contact.domain.model.Contact;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SegmentMatchQueryService {

    private final SegmentRuleEvaluator ruleEvaluator;

    @PersistenceContext
    private EntityManager entityManager;

    public long count(UUID workspaceId, AudienceSegment.MatchLogic matchLogic, List<SegmentCondition> conditions) {
        SegmentRuleEvaluator.BuiltQuery built = ruleEvaluator.build(workspaceId, matchLogic, conditions);
        Query query = entityManager.createNativeQuery("SELECT COUNT(*) FROM contacts c WHERE " + built.whereSql());
        applyParams(query, built.params());
        return ((Number) query.getSingleResult()).longValue();
    }

    @SuppressWarnings("unchecked")
    public Page<Contact> findPage(
            UUID workspaceId,
            AudienceSegment.MatchLogic matchLogic,
            List<SegmentCondition> conditions,
            String q,
            String status,
            Pageable pageable
    ) {
        SegmentRuleEvaluator.BuiltQuery built = ruleEvaluator.build(workspaceId, matchLogic, conditions);
        StringBuilder where = new StringBuilder(built.whereSql());
        Map<String, Object> params = new java.util.LinkedHashMap<>(built.params());

        if (status != null && !status.isBlank()) {
            where.append(" AND c.status = :filterStatus");
            params.put("filterStatus", status);
        }
        if (q != null && !q.isBlank()) {
            where.append("""
                     AND (
                          LOWER(c.email) LIKE :filterQ
                          OR LOWER(c.first_name) LIKE :filterQ
                          OR LOWER(c.last_name) LIKE :filterQ
                          OR LOWER(COALESCE(c.company, '')) LIKE :filterQ
                     )
                    """);
            params.put("filterQ", q.toLowerCase(Locale.ROOT));
        }

        Query countQuery = entityManager.createNativeQuery("SELECT COUNT(*) FROM contacts c WHERE " + where);
        applyParams(countQuery, params);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        Query dataQuery = entityManager.createNativeQuery(
                "SELECT * FROM contacts c WHERE " + where + " ORDER BY c.created_at DESC",
                Contact.class
        );
        applyParams(dataQuery, params);
        dataQuery.setFirstResult((int) pageable.getOffset());
        dataQuery.setMaxResults(pageable.getPageSize());
        List<Contact> content = dataQuery.getResultList();
        return new PageImpl<>(content, pageable, total);
    }

    private void applyParams(Query query, Map<String, Object> params) {
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }
    }
}
