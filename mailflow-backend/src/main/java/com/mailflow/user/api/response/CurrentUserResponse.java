package com.mailflow.user.api.response;

import com.mailflow.user.domain.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrentUserResponse {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserStatus status;
    private boolean emailVerified;
    private String phone;
    private String jobTitle;
    private Set<String> roles;
    private boolean twoFactorEnabled;
    private String avatarUrl;
    private Instant createdAt;
}
