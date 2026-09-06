CREATE TABLE email_engagement_events
(
    id           UUID PRIMARY KEY,
    workspace_id UUID         NOT NULL,
    campaign_id  UUID         NOT NULL,
    contact_id   UUID         NOT NULL,
    event_type   VARCHAR(16)  NOT NULL,
    target_url   VARCHAR(2000),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_engagement_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_engagement_campaign
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
    CONSTRAINT fk_engagement_contact
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
    CONSTRAINT chk_engagement_event_type
        CHECK (event_type IN ('OPEN', 'CLICK'))
);

CREATE INDEX idx_engagement_campaign_type
    ON email_engagement_events (campaign_id, event_type);

CREATE INDEX idx_engagement_workspace_created
    ON email_engagement_events (workspace_id, created_at DESC);

-- First open only per contact/campaign (rates use distinct contacts)
CREATE UNIQUE INDEX uq_engagement_open_once
    ON email_engagement_events (campaign_id, contact_id)
    WHERE event_type = 'OPEN';
