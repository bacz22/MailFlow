package com.mailflow.infrastructure.mail;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Second SMTP transport for campaign From = sender@verified-domain (Brevo / MailerSend / etc.).
 * System auth mail keeps using spring.mail.* via Boot auto-config.
 */
@Configuration
@EnableConfigurationProperties(EspMailProperties.class)
public class EspMailConfiguration {

    public static final String ESP_MAIL_SENDER = "espMailSender";

    @Bean(name = ESP_MAIL_SENDER)
    public JavaMailSender espMailSender(EspMailProperties props) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        if (!props.isConfigured()) {
            return sender;
        }
        sender.setHost(props.getHost());
        sender.setPort(props.getPort());
        sender.setUsername(props.getUsername());
        sender.setPassword(props.getPassword());
        Properties mailProps = sender.getJavaMailProperties();
        mailProps.put("mail.transport.protocol", "smtp");
        mailProps.put("mail.smtp.auth", "true");
        mailProps.put("mail.smtp.starttls.enable", "true");
        mailProps.put("mail.smtp.starttls.required", "true");
        mailProps.put("mail.smtp.connectiontimeout", "5000");
        mailProps.put("mail.smtp.timeout", "5000");
        mailProps.put("mail.smtp.writetimeout", "5000");
        return sender;
    }
}
