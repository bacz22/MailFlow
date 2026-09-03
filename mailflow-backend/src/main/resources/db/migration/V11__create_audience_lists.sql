CREATE TABLE audience_lists
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    name           VARCHAR(120) NOT NULL,
    description    VARCHAR(500),
    tags           TEXT[]       NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audience_lists_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_audience_lists_workspace_name
    ON audience_lists (workspace_id, LOWER(name));

CREATE INDEX idx_audience_lists_workspace_created
    ON audience_lists (workspace_id, created_at DESC);

CREATE TABLE audience_list_members
(
    id          UUID PRIMARY KEY,
    list_id     UUID        NOT NULL,
    contact_id  UUID        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audience_list_members_list
        FOREIGN KEY (list_id) REFERENCES audience_lists (id) ON DELETE CASCADE,
    CONSTRAINT fk_audience_list_members_contact
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_audience_list_members_list_contact
    ON audience_list_members (list_id, contact_id);

CREATE INDEX idx_audience_list_members_contact
    ON audience_list_members (contact_id);
