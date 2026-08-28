package com.mailflow.auth.api.response;

import com.mailflow.user.domain.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private UserStatus status;
}
