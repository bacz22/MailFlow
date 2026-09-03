CREATE TABLE audience_tags
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    name           VARCHAR(80)  NOT NULL,
    color          VARCHAR(200) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audience_tags_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_audience_tags_workspace_name
    ON audience_tags (workspace_id, LOWER(name));

CREATE INDEX idx_audience_tags_workspace_created
    ON audience_tags (workspace_id, created_at DESC);
