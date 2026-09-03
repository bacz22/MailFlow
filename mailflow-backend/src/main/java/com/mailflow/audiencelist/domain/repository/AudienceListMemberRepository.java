package com.mailflow.audiencelist.domain.repository;

import com.mailflow.audiencelist.domain.model.AudienceListMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface AudienceListMemberRepository extends JpaRepository<AudienceListMember, UUID> {

    boolean existsByListIdAndContactId(UUID listId, UUID contactId);

    List<AudienceListMember> findByListId(UUID listId);

    List<AudienceListMember> findByContactId(UUID contactId);

    void deleteByListIdAndContactId(UUID listId, UUID contactId);

    void deleteByContactId(UUID contactId);

    @Query(value = """
            SELECT
                m.list_id,
                COUNT(*)::bigint,
                COUNT(*) FILTER (WHERE c.status = 'ACTIVE')::bigint,
                COUNT(*) FILTER (WHERE c.status = 'UNSUBSCRIBED')::bigint
            FROM audience_list_members m
            JOIN contacts c ON c.id = m.contact_id
            WHERE m.list_id IN (:listIds)
            GROUP BY m.list_id
            """, nativeQuery = true)
    List<Object[]> countMembersByListIds(@Param("listIds") Collection<UUID> listIds);

    @Query(value = """
            SELECT m.contact_id, l.name, l.id
            FROM audience_list_members m
            JOIN audience_lists l ON l.id = m.list_id
            WHERE m.contact_id IN (:contactIds)
            ORDER BY l.name
            """, nativeQuery = true)
    List<Object[]> findListNamesByContactIds(@Param("contactIds") Collection<UUID> contactIds);
}
