CREATE TABLE audience_segments
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    name           VARCHAR(120) NOT NULL,
    description    VARCHAR(500),
    match_logic    VARCHAR(8)   NOT NULL DEFAULT 'AND',
    conditions     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audience_segments_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_audience_segments_match_logic
        CHECK (match_logic IN ('AND', 'OR'))
);

CREATE UNIQUE INDEX uk_audience_segments_workspace_name
    ON audience_segments (workspace_id, LOWER(name));

CREATE INDEX idx_audience_segments_workspace_created
    ON audience_segments (workspace_id, created_at DESC);
