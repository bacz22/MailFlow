package com.mailflow.auth.application.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserRegisteredEvent {
    private final String email;
    private final String fullName;
    private final String rawToken;
}
