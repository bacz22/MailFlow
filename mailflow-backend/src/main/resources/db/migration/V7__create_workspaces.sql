CREATE TABLE workspaces
(
    id                      UUID PRIMARY KEY,
    name                    VARCHAR(120) NOT NULL,
    slug                    VARCHAR(140) NOT NULL,
    display_name            VARCHAR(120) NOT NULL,
    brand_color             VARCHAR(16)  NOT NULL DEFAULT '#2563eb',
    timezone                VARCHAR(80)  NOT NULL DEFAULT 'Asia/Bangkok',
    industry                VARCHAR(120),
    enable_open_tracking    BOOLEAN      NOT NULL DEFAULT TRUE,
    enable_click_tracking   BOOLEAN      NOT NULL DEFAULT TRUE,
    enforce_rfc8058         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_workspaces_slug ON workspaces (LOWER(slug));

CREATE TABLE workspace_members
(
    id             UUID PRIMARY KEY,
    workspace_id   UUID         NOT NULL,
    user_id        UUID         NOT NULL,
    role           VARCHAR(40)  NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    invited_at     TIMESTAMPTZ,
    joined_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workspace_members_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_workspace_members_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_workspace_members_role CHECK (role IN (
        'OWNER',
        'ADMIN',
        'MARKETING_MANAGER',
        'CAMPAIGN_EDITOR',
        'CONTACT_MANAGER',
        'ANALYST',
        'BILLING_MANAGER',
        'VIEWER'
    )),
    CONSTRAINT chk_workspace_members_status CHECK (status IN ('ACTIVE', 'PENDING', 'DISABLED'))
);

CREATE UNIQUE INDEX uk_workspace_members_workspace_user
    ON workspace_members (workspace_id, user_id);

CREATE INDEX idx_workspace_members_user_id ON workspace_members (user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members (workspace_id);

INSERT INTO workspaces (
    id, name, slug, display_name, brand_color, timezone, industry,
    enable_open_tracking, enable_click_tracking, enforce_rfc8058, created_at, updated_at
)
SELECT gen_random_uuid(),
       COALESCE(NULLIF(TRIM(u.last_name || ' ' || u.first_name), ''), split_part(u.email, '@', 1))
           || ' Workspace',
       'ws-' || REPLACE(u.id::text, '-', ''),
       COALESCE(NULLIF(TRIM(u.last_name || ' ' || u.first_name), ''), split_part(u.email, '@', 1)),
       '#2563eb',
       'Asia/Bangkok',
       NULL,
       TRUE,
       TRUE,
       TRUE,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM users u
WHERE u.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM workspace_members m WHERE m.user_id = u.id
  );

INSERT INTO workspace_members (
    id, workspace_id, user_id, role, status, joined_at, created_at, updated_at
)
SELECT gen_random_uuid(),
       w.id,
       u.id,
       'OWNER',
       'ACTIVE',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM users u
JOIN workspaces w ON w.slug = 'ws-' || REPLACE(u.id::text, '-', '')
WHERE u.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM workspace_members m WHERE m.user_id = u.id
  );
