package com.mailflow.infrastructure.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail sender configuration:
 * 1. Primary "mailSender" for system transactional mail (auth, verification, invite) using spring.mail.* (Gmail SMTP).
 * 2. Secondary "espMailSender" for campaign From = sender@verified-domain (Brevo / MailerSend / etc.).
 */
@Configuration
@EnableConfigurationProperties(EspMailProperties.class)
public class EspMailConfiguration {

    public static final String SYSTEM_MAIL_SENDER = "mailSender";
    public static final String ESP_MAIL_SENDER = "espMailSender";

    @Bean(name = SYSTEM_MAIL_SENDER)
    @Primary
    public JavaMailSender mailSender(
            @Value("${spring.mail.host:smtp.gmail.com}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean auth,
            @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean starttlsEnable,
            @Value("${spring.mail.properties.mail.smtp.starttls.required:true}") boolean starttlsRequired,
            @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}") int connectionTimeout,
            @Value("${spring.mail.properties.mail.smtp.timeout:5000}") int timeout,
            @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}") int writeTimeout
    ) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        if (host == null || host.isBlank()) {
            return sender;
        }
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        Properties mailProps = sender.getJavaMailProperties();
        mailProps.put("mail.transport.protocol", "smtp");
        mailProps.put("mail.smtp.auth", String.valueOf(auth));
        mailProps.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnable));
        mailProps.put("mail.smtp.starttls.required", String.valueOf(starttlsRequired));
        mailProps.put("mail.smtp.connectiontimeout", String.valueOf(connectionTimeout));
        mailProps.put("mail.smtp.timeout", String.valueOf(timeout));
        mailProps.put("mail.smtp.writetimeout", String.valueOf(writeTimeout));
        return sender;
    }

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
