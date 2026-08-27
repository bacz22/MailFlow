package com.mailflow.auth.dto;

import com.mailflow.entity.UserStatus;
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
public class RegisterResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserStatus status;
    private Set<String> roles;
    private String message;
    private Instant createdAt;
}
