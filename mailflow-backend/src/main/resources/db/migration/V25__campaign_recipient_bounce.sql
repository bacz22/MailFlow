-- Bounce tracking: recipient status + ESP message id for Brevo webhook correlation
ALTER TABLE campaign_recipients
    DROP CONSTRAINT chk_campaign_recipients_status;

ALTER TABLE campaign_recipients
    ADD CONSTRAINT chk_campaign_recipients_status
        CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED', 'SKIPPED', 'BOUNCED'));

ALTER TABLE campaign_recipients
    ADD COLUMN provider_message_id VARCHAR(320);

CREATE INDEX idx_campaign_recipients_email_status
    ON campaign_recipients (email, status);

CREATE INDEX idx_campaign_recipients_provider_message_id
    ON campaign_recipients (provider_message_id)
    WHERE provider_message_id IS NOT NULL;
