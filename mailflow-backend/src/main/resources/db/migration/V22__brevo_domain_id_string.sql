-- Brevo API returns hexadecimal string ID (MongoDB ObjectId), e.g. "6a9bccccd8cebd0aee02b3ce"
ALTER TABLE sending_domains
    ALTER COLUMN brevo_domain_id TYPE VARCHAR(64);
