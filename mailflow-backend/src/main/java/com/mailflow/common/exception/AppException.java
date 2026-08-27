package com.mailflow.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final String type;

    public AppException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.type = "https://mailflow.dev/problems/" + code.toLowerCase().replace('_', '-');
    }

    public AppException(HttpStatus status, String code, String message, String type) {
        super(message);
        this.status = status;
        this.code = code;
        this.type = type;
    }
}
