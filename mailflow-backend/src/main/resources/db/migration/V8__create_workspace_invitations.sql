CREATE TABLE workspace_invitations
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    email          VARCHAR(320) NOT NULL,
    role           VARCHAR(40)  NOT NULL,
    token_hash     VARCHAR(255) NOT NULL,
    invited_by     UUID         NOT NULL,
    expires_at     TIMESTAMPTZ  NOT NULL,
    accepted_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workspace_invitations_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_workspace_invitations_invited_by
        FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_workspace_invitations_role CHECK (role IN (
        'OWNER',
        'ADMIN',
        'MARKETING_MANAGER',
        'CAMPAIGN_EDITOR',
        'CONTACT_MANAGER',
        'ANALYST',
        'BILLING_MANAGER',
        'VIEWER'
    ))
);

CREATE UNIQUE INDEX uk_workspace_invitations_token_hash ON workspace_invitations (token_hash);
CREATE INDEX idx_workspace_invitations_workspace_email
    ON workspace_invitations (workspace_id, LOWER(email));
