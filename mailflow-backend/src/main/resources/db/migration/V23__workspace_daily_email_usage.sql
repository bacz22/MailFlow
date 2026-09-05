CREATE TABLE workspace_daily_email_usage
(
    workspace_id UUID   NOT NULL,
    usage_date   DATE   NOT NULL,
    sent_count   BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT pk_workspace_daily_email_usage
        PRIMARY KEY (workspace_id, usage_date),
    CONSTRAINT fk_workspace_daily_email_usage_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT chk_workspace_daily_email_usage_sent_count
        CHECK (sent_count >= 0)
);
