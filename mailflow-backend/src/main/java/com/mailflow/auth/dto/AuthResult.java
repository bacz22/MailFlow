package com.mailflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseCookie;

@Getter
@AllArgsConstructor
public class AuthResult {
    private final LoginResponse response;
    private final ResponseCookie cookie;
}
