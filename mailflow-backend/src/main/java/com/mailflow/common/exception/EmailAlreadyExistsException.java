package com.mailflow.common.exception;

import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends AppException {
    public EmailAlreadyExistsException(String email) {
        super(
                HttpStatus.CONFLICT,
                "EMAIL_ALREADY_EXISTS",
                "Email '" + email + "' đã được sử dụng trong hệ thống."
        );
    }
}
