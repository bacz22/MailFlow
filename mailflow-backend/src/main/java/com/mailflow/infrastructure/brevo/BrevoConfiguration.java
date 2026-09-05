package com.mailflow.infrastructure.brevo;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(BrevoProperties.class)
public class BrevoConfiguration {
}
