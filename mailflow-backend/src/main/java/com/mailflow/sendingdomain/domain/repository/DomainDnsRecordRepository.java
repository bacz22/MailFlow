package com.mailflow.sendingdomain.domain.repository;

import com.mailflow.sendingdomain.domain.model.DomainDnsRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DomainDnsRecordRepository extends JpaRepository<DomainDnsRecord, UUID> {

    List<DomainDnsRecord> findByDomainIdOrderByCreatedAtAsc(UUID domainId);

    void deleteByDomainId(UUID domainId);
}
