-- =============================================================================
-- Migration: V4__refactor_auth_sessions_and_create_refresh_tokens.sql
-- Description: Tạo bảng refresh_tokens và refactor auth_sessions phục vụ RTR
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens
(
    id                   UUID PRIMARY KEY,
    session_id           UUID NOT NULL,
    token_hash           VARCHAR(255) NOT NULL,

    expires_at           TIMESTAMPTZ NOT NULL,
    consumed_at          TIMESTAMPTZ,
    revoked_at           TIMESTAMPTZ,
    revoke_reason        VARCHAR(100),
    replaced_by_token_id UUID,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_session
        FOREIGN KEY (session_id)
        REFERENCES auth_sessions (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_refresh_tokens_replaced_by
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES refresh_tokens (id)
        ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_refresh_tokens_token_hash
    ON refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id
    ON refresh_tokens (session_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
    ON refresh_tokens (expires_at);

-- Migrate dữ liệu cũ nếu auth_sessions có cột refresh_token_hash
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_sessions' AND column_name = 'refresh_token_hash'
    ) THEN
        INSERT INTO refresh_tokens (id, session_id, token_hash, expires_at, created_at)
        SELECT gen_random_uuid(), id, refresh_token_hash, expires_at, created_at
        FROM auth_sessions
        WHERE refresh_token_hash IS NOT NULL
        ON CONFLICT DO NOTHING;

        DROP INDEX IF EXISTS uk_auth_sessions_refresh_token_hash;
        ALTER TABLE auth_sessions DROP COLUMN IF EXISTS refresh_token_hash;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_sessions' AND column_name = 'token_family_id'
    ) THEN
        DROP INDEX IF EXISTS idx_auth_sessions_token_family;
        ALTER TABLE auth_sessions DROP COLUMN IF EXISTS token_family_id;
    END IF;
END $$;

ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS revoke_reason VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_revoked
    ON auth_sessions (user_id, revoked_at);
