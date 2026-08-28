package com.mailflow.common.web;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {

    @Test
    @DisplayName("request null -> 127.0.0.1, không để trống")
    void nullRequest_defaultsToLocalhost() {
        assertThat(ClientIpResolver.resolve(null)).isEqualTo("127.0.0.1");
    }

    @Test
    @DisplayName("IPv6 loopback ::1 / 0:0:0:0:0:0:0:1 -> 127.0.0.1")
    void ipv6Loopback_normalized() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("https://example.net/id/garnet");
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("127.0.0.1");

        request.setRemoteAddr("::1");
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("127.0.0.1");
    }

    @Test
    @DisplayName("X-Forwarded-For lấy IP client đầu tiên")
    void forwardedFor_usesFirstHop() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("203.0.113.10");
    }

    @Test
    @DisplayName("X-Real-IP được ưu tiên khi không có CF-Connecting-IP")
    void realIp_used() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Real-IP", "198.51.100.20");
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("198.51.100.20");
    }

    @Test
    @DisplayName("remoteAddr trống -> 127.0.0.1")
    void blankRemote_defaults() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("  ");
        assertThat(ClientIpResolver.resolve(request)).isEqualTo("127.0.0.1");
    }
}
