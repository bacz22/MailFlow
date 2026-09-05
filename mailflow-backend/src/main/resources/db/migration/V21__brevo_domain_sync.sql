-- Brevo domain sync: store Brevo id + global unique domain (anti-hijack across workspaces)
ALTER TABLE sending_domains
    ADD COLUMN IF NOT EXISTS brevo_domain_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_sending_domains_domain_lower
    ON sending_domains (LOWER(domain));
