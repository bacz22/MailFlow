CREATE TABLE email_senders
(
    id           UUID PRIMARY KEY,
    workspace_id UUID         NOT NULL,
    name         VARCHAR(160) NOT NULL,
    email        VARCHAR(320) NOT NULL,
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    status       VARCHAR(20)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_senders_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_email_senders_status
        CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE UNIQUE INDEX uk_email_senders_workspace_email
    ON email_senders (workspace_id, LOWER(email));

CREATE INDEX idx_email_senders_workspace_updated
    ON email_senders (workspace_id, updated_at DESC);
