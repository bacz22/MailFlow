CREATE TABLE users
(
    id                   UUID PRIMARY KEY,
    email                VARCHAR(320) NOT NULL,
    password             VARCHAR(255) NOT NULL,
    first_name           VARCHAR(50) NOT NULL,
    last_name            VARCHAR(50) NOT NULL,

    status               VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    email_verified_at    TIMESTAMPTZ,
    two_factor_enabled   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_status
        CHECK (status IN ('PENDING', 'ACTIVE', 'LOCKED', 'DISABLED'))
);

CREATE UNIQUE INDEX uk_users_email
    ON users (LOWER(email));


CREATE TABLE auth_sessions
(
    id                   UUID PRIMARY KEY,
    user_id              UUID NOT NULL,
    refresh_token_hash   VARCHAR(255) NOT NULL,
    token_family_id      UUID NOT NULL,

    device               VARCHAR(255),
    browser              VARCHAR(100),
    operating_system     VARCHAR(100),
    ip_address           VARCHAR(45),

    last_active_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at           TIMESTAMPTZ NOT NULL,
    revoked_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_auth_sessions_refresh_token_hash
    ON auth_sessions (refresh_token_hash);

CREATE INDEX idx_auth_sessions_user_id
    ON auth_sessions (user_id);

CREATE INDEX idx_auth_sessions_token_family
    ON auth_sessions (token_family_id);

CREATE INDEX idx_auth_sessions_expires_at
    ON auth_sessions (expires_at);


CREATE TABLE one_time_tokens
(
    id                   UUID PRIMARY KEY,
    user_id              UUID NOT NULL,
    purpose              VARCHAR(30) NOT NULL,
    token_hash           VARCHAR(255) NOT NULL,

    expires_at           TIMESTAMPTZ NOT NULL,
    consumed_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_one_time_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_one_time_tokens_purpose
        CHECK (purpose IN (
            'EMAIL_VERIFICATION',
            'PASSWORD_RESET'
        ))
);

CREATE UNIQUE INDEX uk_one_time_tokens_token_hash
    ON one_time_tokens (token_hash);

CREATE INDEX idx_one_time_tokens_user_purpose
    ON one_time_tokens (user_id, purpose);

CREATE INDEX idx_one_time_tokens_expires_at
    ON one_time_tokens (expires_at);