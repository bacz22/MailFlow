package com.mailflow.infrastructure.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mailflow.mail.esp")
public class EspMailProperties {

    private String host = "";
    private int port = 587;
    private String username = "";
    private String password = "";

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host == null ? "" : host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username == null ? "" : username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password == null ? "" : password;
    }

    public boolean isConfigured() {
        return host != null && !host.isBlank()
                && username != null && !username.isBlank()
                && password != null && !password.isBlank();
    }
}
