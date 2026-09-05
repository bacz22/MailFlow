package com.mailflow.infrastructure.brevo;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mailflow.brevo")
public class BrevoProperties {

    private String apiKey = "";
    private String apiBaseUrl = "https://api.brevo.com/v3";

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl == null || apiBaseUrl.isBlank()
                ? "https://api.brevo.com/v3"
                : apiBaseUrl.trim().replaceAll("/$", "");
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
