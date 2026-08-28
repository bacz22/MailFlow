package com.mailflow.common.exception;

import com.mailflow.common.api.ApiErrorResponse;
import com.mailflow.common.api.FieldErrorDetail;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<FieldErrorDetail> fieldErrors = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.add(FieldErrorDetail.builder()
                    .field(error.getField())
                    .code(error.getCode())
                    .message(error.getDefaultMessage())
                    .build());
        }
        for (org.springframework.validation.ObjectError error : ex.getBindingResult().getGlobalErrors()) {
            fieldErrors.add(FieldErrorDetail.builder()
                    .field(error.getObjectName())
                    .code(error.getCode())
                    .message(error.getDefaultMessage())
                    .build());
        }

        ApiErrorResponse response = ApiErrorResponse.builder()
                .type("https://mailflow.dev/problems/validation-error")
                .title("Dữ liệu không hợp lệ")
                .status(HttpStatus.UNPROCESSABLE_ENTITY.value())
                .code("VALIDATION_ERROR")
                .detail("Một hoặc nhiều trường dữ liệu không hợp lệ.")
                .instance(request.getRequestURI())
                .requestId(getOrCreateRequestId(request))
                .timestamp(Instant.now())
                .errors(fieldErrors)
                .build();

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(
            AppException ex,
            HttpServletRequest request
    ) {
        log.warn("AppException caught: [{}] {}", ex.getCode(), ex.getMessage());

        ApiErrorResponse response = ApiErrorResponse.builder()
                .type(ex.getType())
                .title(ex.getStatus().getReasonPhrase())
                .status(ex.getStatus().value())
                .code(ex.getCode())
                .detail(ex.getMessage())
                .instance(request.getRequestURI())
                .requestId(getOrCreateRequestId(request))
                .timestamp(Instant.now())
                .build();

        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        log.warn("IllegalArgumentException: {}", ex.getMessage());

        ApiErrorResponse response = ApiErrorResponse.builder()
                .type("https://mailflow.dev/problems/bad-request")
                .title("Yêu cầu không hợp lệ")
                .status(HttpStatus.BAD_REQUEST.value())
                .code("BAD_REQUEST")
                .detail(ex.getMessage())
                .instance(request.getRequestURI())
                .requestId(getOrCreateRequestId(request))
                .timestamp(Instant.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse response = ApiErrorResponse.builder()
                .type("https://mailflow.dev/problems/avatar-too-large")
                .title("File quá lớn")
                .status(HttpStatus.BAD_REQUEST.value())
                .code("AVATAR_TOO_LARGE")
                .detail("Ảnh đại diện tối đa 2MB.")
                .instance(request.getRequestURI())
                .requestId(getOrCreateRequestId(request))
                .timestamp(Instant.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unhandled exception occurred at URI: " + request.getRequestURI(), ex);

        ApiErrorResponse response = ApiErrorResponse.builder()
                .type("https://mailflow.dev/problems/internal-server-error")
                .title("Lỗi hệ thống")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .code("INTERNAL_SERVER_ERROR")
                .detail("Đã xảy ra lỗi không mong muốn trên máy chủ. Vui lòng thử lại sau.")
                .instance(request.getRequestURI())
                .requestId(getOrCreateRequestId(request))
                .timestamp(Instant.now())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private String getOrCreateRequestId(HttpServletRequest request) {
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        return requestId;
    }
}
