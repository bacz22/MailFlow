package com.mailflow.auth.infrastructure.security;

import com.mailflow.common.security.SecurityErrorWriter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class AuthRateLimitFilterTest {

    @Test
    @DisplayName("Vượt hạn login 10 request/phút/IP -> 429 RATE_LIMITED")
    void loginExceedsLimit_returns429() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new SecurityErrorWriter());
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("10.0.0.8");

        for (int i = 0; i < 10; i++) {
            MockHttpServletResponse ok = new MockHttpServletResponse();
            filter.doFilter(request, ok, chain);
            assertThat(ok.getStatus()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request, blocked, chain);

        assertThat(blocked.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(blocked.getContentAsString()).contains("RATE_LIMITED");
        verify(chain, times(10)).doFilter(any(), any());
    }

    @Test
    @DisplayName("Vượt hạn forgot-password 3 request/phút/IP -> 429 RATE_LIMITED")
    void forgotPasswordExceedsLimit_returns429() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new SecurityErrorWriter());
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/forgot-password");
        request.setRemoteAddr("10.0.0.8");

        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse ok = new MockHttpServletResponse();
            filter.doFilter(request, ok, chain);
            assertThat(ok.getStatus()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request, blocked, chain);

        assertThat(blocked.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(blocked.getContentAsString()).contains("RATE_LIMITED");
        verify(chain, times(3)).doFilter(any(), any());
    }
}
