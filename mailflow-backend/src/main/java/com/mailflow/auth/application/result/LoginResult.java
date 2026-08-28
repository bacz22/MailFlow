package com.mailflow.auth.application.result;

import com.mailflow.auth.api.response.LoginResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseCookie;

@Getter
@AllArgsConstructor
public class LoginResult {
    private final LoginResponse response;
    private final ResponseCookie cookie;
}
