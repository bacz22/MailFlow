CREATE TABLE email_templates
(
    id                  UUID PRIMARY KEY,
    workspace_id        UUID         NOT NULL,
    name                VARCHAR(160) NOT NULL,
    subject             VARCHAR(200) NOT NULL,
    preview_text        VARCHAR(200),
    category            VARCHAR(40)  NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    html_content        TEXT         NOT NULL,
    thumbnail_gradient  VARCHAR(120),
    created_by          UUID,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_templates_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_email_templates_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_email_templates_category
        CHECK (category IN ('Newsletter', 'Product', 'Onboarding', 'Promotional', 'Transactional'))
);

CREATE UNIQUE INDEX uk_email_templates_workspace_name
    ON email_templates (workspace_id, LOWER(name));

CREATE INDEX idx_email_templates_workspace_updated
    ON email_templates (workspace_id, updated_at DESC);
