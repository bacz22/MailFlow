package com.mailflow.auth.api.request;

/**
 * Dành cho client không sử dụng HttpOnly cookie. Web client hiện tại gửi refresh token bằng cookie.
 */
public record RefreshTokenRequest(String refreshToken) {
}
