package com.mailflow.infrastructure.storage;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "mailflow.cloudinary")
public class CloudinaryProperties {

    private String cloudName = "";
    private String apiKey = "";
    private String apiSecret = "";
    private String folder = "mailflow/avatars";

    public boolean isConfigured() {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }
}
