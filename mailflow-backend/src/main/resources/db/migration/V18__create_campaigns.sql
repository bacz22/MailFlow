CREATE TABLE campaigns
(
    id                    UUID PRIMARY KEY,
    workspace_id          UUID         NOT NULL,
    name                  VARCHAR(200) NOT NULL,
    subject               VARCHAR(200) NOT NULL,
    preview_text          VARCHAR(200),
    sender_id             UUID,
    reply_to              VARCHAR(320),
    template_id           UUID,
    html_content          TEXT         NOT NULL DEFAULT '',
    status                VARCHAR(30)  NOT NULL,
    send_type             VARCHAR(20)  NOT NULL DEFAULT 'immediate',
    scheduled_at          TIMESTAMPTZ,
    list_ids              UUID[]       NOT NULL DEFAULT '{}',
    segment_ids           UUID[]       NOT NULL DEFAULT '{}',
    excluded_list_ids     UUID[]       NOT NULL DEFAULT '{}',
    estimated_recipients  BIGINT       NOT NULL DEFAULT 0,
    created_by            UUID,
    submitted_at          TIMESTAMPTZ,
    reviewed_at           TIMESTAMPTZ,
    review_note           VARCHAR(1000),
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_campaigns_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_campaigns_sender
        FOREIGN KEY (sender_id) REFERENCES email_senders (id) ON DELETE SET NULL,
    CONSTRAINT fk_campaigns_template
        FOREIGN KEY (template_id) REFERENCES email_templates (id) ON DELETE SET NULL,
    CONSTRAINT chk_campaigns_status
        CHECK (status IN (
            'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
            'SCHEDULED', 'CANCELLED'
        )),
    CONSTRAINT chk_campaigns_send_type
        CHECK (send_type IN ('immediate', 'scheduled'))
);

CREATE INDEX idx_campaigns_workspace_updated
    ON campaigns (workspace_id, updated_at DESC);

CREATE INDEX idx_campaigns_workspace_status
    ON campaigns (workspace_id, status);
