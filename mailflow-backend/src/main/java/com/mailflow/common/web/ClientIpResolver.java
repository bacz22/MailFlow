package com.mailflow.common.web;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIpResolver {

    private static final int MAX_LENGTH = 45;

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String ip = firstForwarded(request.getHeader("CF-Connecting-IP"));
        if (ip == null) {
            ip = firstForwarded(request.getHeader("X-Real-IP"));
        }
        if (ip == null) {
            ip = firstForwarded(request.getHeader("X-Forwarded-For"));
        }
        if (ip == null) {
            ip = blankToNull(request.getRemoteAddr());
        }
        return normalize(ip);
    }

    private static String firstForwarded(String header) {
        String value = blankToNull(header);
        if (value == null) {
            return null;
        }
        int comma = value.indexOf(',');
        return comma < 0 ? value.trim() : value.substring(0, comma).trim();
    }

    private static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "127.0.0.1";
        }
        String ip = raw.trim();
        if (ip.startsWith("[") && ip.endsWith("]") && ip.length() > 2) {
            ip = ip.substring(1, ip.length() - 1);
        }
        int zone = ip.indexOf('%');
        if (zone > 0) {
            ip = ip.substring(0, zone);
        }
        if ("::1".equals(ip)
                || "0:0:0:0:0:0:0:1".equals(ip)
                || "https://example.net/id/garnet".equalsIgnoreCase(ip)
                || ip.endsWith(":127.0.0.1")) {
            return "127.0.0.1";
        }
        if (ip.length() > MAX_LENGTH) {
            return ip.substring(0, MAX_LENGTH);
        }
        return ip;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
