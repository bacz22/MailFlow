package com.mailflow.sendingdomain.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "domain_dns_records")
public class DomainDnsRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "domain_id", nullable = false)
    private UUID domainId;

    @Column(nullable = false, length = 10)
    private String type = "TXT";

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 255)
    private String host;

    @Column(nullable = false, length = 2000)
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DnsRecordPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DnsRecordStatus status = DnsRecordStatus.PENDING;

    @Column(length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public DomainDnsRecord(
            UUID domainId,
            String type,
            String name,
            String host,
            String value,
            DnsRecordPurpose purpose,
            String description
    ) {
        this.domainId = domainId;
        this.type = type;
        this.name = name;
        this.host = host;
        this.value = value;
        this.purpose = purpose;
        this.description = description;
        this.status = DnsRecordStatus.PENDING;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = DnsRecordStatus.PENDING;
        }
        if (type == null || type.isBlank()) {
            type = "TXT";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
