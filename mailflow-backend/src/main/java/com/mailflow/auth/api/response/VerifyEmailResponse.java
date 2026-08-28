package com.mailflow.auth.api.response;

import com.mailflow.user.domain.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyEmailResponse {
    private String email;
    private UserStatus status;
    private String message;
}
