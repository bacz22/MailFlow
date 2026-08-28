package com.mailflow.auth.infrastructure.cookie;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthCookieService {

    private final JwtProperties jwtProperties;

    /**
     * Tạo cookie HttpOnly chứa Refresh Token
     */
    public ResponseCookie createRefreshCookie(String rawRefreshToken, Duration maxAge) {
        return ResponseCookie.from(jwtProperties.getRefreshCookieName(), rawRefreshToken)
                .httpOnly(true)
                .secure(jwtProperties.isRefreshCookieSecure())
                .path("/api/v1/auth")
                .sameSite("Lax")
                .maxAge(maxAge)
                .build();
    }

    /**
     * Tạo cookie xóa Refresh Token (Max-Age = 0)
     */
    public ResponseCookie createCleanRefreshCookie() {
        return ResponseCookie.from(jwtProperties.getRefreshCookieName(), "")
                .httpOnly(true)
                .secure(jwtProperties.isRefreshCookieSecure())
                .path("/api/v1/auth")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }
}
