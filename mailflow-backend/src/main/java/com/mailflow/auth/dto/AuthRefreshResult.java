package com.mailflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseCookie;

@Getter
@AllArgsConstructor
public class AuthRefreshResult {
    private final RefreshResponse response;
    private final ResponseCookie cookie;
}
