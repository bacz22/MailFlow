package com.mailflow.auth.infrastructure.jwt;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import com.mailflow.user.domain.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    /**
     * Phát hành Account-scoped Access Token (RS256 JWT) 15 phút theo chuẩn multi-workspace
     * (Không chứa global roles; roles sẽ được cấp theo từng workspace sau khi user switch-workspace).
     */
    public String issueAccessToken(User user, UUID sessionId) {
        return encode(user, sessionId, null, List.of());
    }

    public String issueWorkspaceAccessToken(User user, UUID sessionId, UUID workspaceId, List<String> roles) {
        return encode(user, sessionId, workspaceId, roles == null ? List.of() : roles);
    }

    private String encode(User user, UUID sessionId, UUID workspaceId, List<String> roles) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.getAccessTokenTtl());
        String jti = UUID.randomUUID().toString();

        JwsHeader jwsHeader = JwsHeader.with(() -> "RS256")
                .keyId(jwtProperties.getKeyId())
                .type("at+JWT")
                .build();

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.getIssuer())
                .subject(user.getId().toString())
                .audience(List.of(jwtProperties.getAudience()))
                .issuedAt(now)
                .notBefore(now)
                .expiresAt(expiresAt)
                .id(jti)
                .claim("token_version", 1);
        if (sessionId != null) {
            claims.claim("sid", sessionId.toString());
        }
        if (workspaceId != null) {
            claims.claim("wid", workspaceId.toString());
            claims.claim("roles", roles);
        }

        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims.build())).getTokenValue();
    }
}
