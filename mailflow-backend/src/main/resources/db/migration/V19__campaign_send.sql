ALTER TABLE campaigns
    DROP CONSTRAINT chk_campaigns_status;

ALTER TABLE campaigns
    ADD CONSTRAINT chk_campaigns_status
        CHECK (status IN (
            'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
            'SCHEDULED', 'SENDING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'
        ));

ALTER TABLE campaigns
    ADD COLUMN sent_count BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN started_at TIMESTAMPTZ,
    ADD COLUMN completed_at TIMESTAMPTZ;

CREATE TABLE campaign_recipients
(
    id           UUID PRIMARY KEY,
    campaign_id  UUID         NOT NULL,
    workspace_id UUID         NOT NULL,
    contact_id   UUID         NOT NULL,
    email        VARCHAR(320) NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    error        VARCHAR(1000),
    sent_at      TIMESTAMPTZ,
    attempts     INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaign_recipients_campaign
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_recipients_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_recipients_contact
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
    CONSTRAINT chk_campaign_recipients_status
        CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED', 'SKIPPED')),
    CONSTRAINT uq_campaign_recipients_campaign_contact
        UNIQUE (campaign_id, contact_id)
);

CREATE INDEX idx_campaign_recipients_campaign_status
    ON campaign_recipients (campaign_id, status);

CREATE INDEX idx_campaign_recipients_status_updated
    ON campaign_recipients (status, updated_at);
