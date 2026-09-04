CREATE TABLE sending_domains
(
    id           UUID PRIMARY KEY,
    workspace_id UUID         NOT NULL,
    domain       VARCHAR(255) NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sending_domains_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_sending_domains_status
        CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED'))
);

CREATE UNIQUE INDEX uk_sending_domains_workspace_domain
    ON sending_domains (workspace_id, LOWER(domain));

CREATE INDEX idx_sending_domains_workspace_updated
    ON sending_domains (workspace_id, updated_at DESC);

CREATE TABLE domain_dns_records
(
    id          UUID PRIMARY KEY,
    domain_id   UUID         NOT NULL,
    type        VARCHAR(10)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    host        VARCHAR(255) NOT NULL,
    value       VARCHAR(2000) NOT NULL,
    purpose     VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_domain_dns_records_domain
        FOREIGN KEY (domain_id) REFERENCES sending_domains (id) ON DELETE CASCADE,
    CONSTRAINT chk_domain_dns_records_type
        CHECK (type IN ('TXT', 'CNAME', 'MX')),
    CONSTRAINT chk_domain_dns_records_purpose
        CHECK (purpose IN ('SPF', 'DKIM', 'DMARC', 'MX', 'VERIFY')),
    CONSTRAINT chk_domain_dns_records_status
        CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED'))
);

CREATE INDEX idx_domain_dns_records_domain
    ON domain_dns_records (domain_id);

ALTER TABLE email_senders
    ADD COLUMN domain_id UUID;

ALTER TABLE email_senders
    ADD CONSTRAINT fk_email_senders_domain
        FOREIGN KEY (domain_id) REFERENCES sending_domains (id) ON DELETE SET NULL;

CREATE INDEX idx_email_senders_domain
    ON email_senders (domain_id);
