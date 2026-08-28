package com.mailflow.auth.application.result;

import com.mailflow.auth.api.response.RefreshResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseCookie;

@Getter
@AllArgsConstructor
public class RefreshResult {
    private final RefreshResponse response;
    private final ResponseCookie cookie;
}
