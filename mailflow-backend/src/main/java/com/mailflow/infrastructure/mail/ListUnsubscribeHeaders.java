package com.mailflow.infrastructure.mail;

/**
 * Optional RFC 8058 List-Unsubscribe headers for campaign / marketing mail.
 */
public record ListUnsubscribeHeaders(String httpsUrl, String oneClickUrl) {

    public boolean isPresent() {
        return httpsUrl != null && !httpsUrl.isBlank();
    }
}
