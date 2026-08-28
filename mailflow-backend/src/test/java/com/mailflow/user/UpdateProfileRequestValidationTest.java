package com.mailflow.user;

import com.mailflow.user.api.request.UpdateProfileRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class UpdateProfileRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    @DisplayName("PATCH hợp lệ: tên bắt buộc, SĐT optional")
    void validRequest() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("An")
                .lastName("Nguyen Van")
                .phone("+84 912 345 678")
                .jobTitle("Owner")
                .build();

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    @DisplayName("Thiếu tên -> validation error")
    void blankFirstName_invalid() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("  ")
                .lastName("Nguyen")
                .build();

        Set<ConstraintViolation<UpdateProfileRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("firstName"));
    }

    @Test
    @DisplayName("SĐT chứa chữ -> validation error")
    void invalidPhone_rejected() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("An")
                .lastName("Nguyen")
                .phone("abc")
                .build();

        Set<ConstraintViolation<UpdateProfileRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("phone"));
    }
}
