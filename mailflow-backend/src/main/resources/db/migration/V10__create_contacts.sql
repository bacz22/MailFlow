CREATE TABLE contacts
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    email          VARCHAR(320) NOT NULL,
    first_name     VARCHAR(50)  NOT NULL,
    last_name      VARCHAR(50)  NOT NULL,
    company        VARCHAR(160),
    phone          VARCHAR(40),
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    tags           TEXT[]       NOT NULL DEFAULT '{}',
    custom_fields  JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contacts_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_contacts_status CHECK (status IN (
        'ACTIVE',
        'UNSUBSCRIBED',
        'BOUNCED',
        'INVALID',
        'BLOCKED'
    ))
);

CREATE UNIQUE INDEX uk_contacts_workspace_email
    ON contacts (workspace_id, LOWER(email));

CREATE INDEX idx_contacts_workspace_created
    ON contacts (workspace_id, created_at DESC);

CREATE INDEX idx_contacts_workspace_status
    ON contacts (workspace_id, status);

CREATE INDEX idx_contacts_tags
    ON contacts USING GIN (tags);
