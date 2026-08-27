package com.mailflow.auth.service;

import com.mailflow.auth.dto.AuthRefreshResult;
import com.mailflow.auth.dto.AuthResult;
import com.mailflow.auth.dto.LoginRequest;
import com.mailflow.auth.dto.RegisterRequest;
import com.mailflow.auth.dto.RegisterResponse;
import com.mailflow.auth.dto.ResendVerificationRequest;
import com.mailflow.auth.dto.SessionResponse;
import com.mailflow.auth.dto.VerifyEmailRequest;
import com.mailflow.auth.dto.VerifyEmailResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.util.List;
import java.util.UUID;

public interface IAuthService {

    RegisterResponse register(RegisterRequest request);

    VerifyEmailResponse verifyEmail(VerifyEmailRequest request);

    void resendVerification(ResendVerificationRequest request);

    AuthResult login(LoginRequest request, HttpServletRequest httpRequest);

    AuthRefreshResult refresh(String rawRefreshToken, HttpServletRequest httpRequest);

    ResponseCookie logout(String sidStr);

    ResponseCookie logoutAll(UUID userId);

    List<SessionResponse> getSessions(UUID userId, UUID currentSessionId);

    void revokeSession(UUID sessionId, UUID userId);
}
