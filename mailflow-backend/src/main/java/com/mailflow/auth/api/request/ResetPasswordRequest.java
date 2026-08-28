package com.mailflow.auth.api.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class ResetPasswordRequest {

    @NotBlank(message = "Mã đặt lại mật khẩu không được để trống")
    private String token;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = ".*[A-Z].*", message = "Phải chứa ít nhất 1 chữ cái in hoa")
    @Pattern(regexp = ".*[0-9].*", message = "Phải chứa ít nhất 1 chữ số")
    @Pattern(regexp = ".*[^A-Za-z0-9].*", message = "Phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)")
    private String password;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu")
    private String confirmPassword;

    @AssertTrue(message = "Mật khẩu xác nhận không khớp")
    public boolean isPasswordMatching() {
        if (password == null || confirmPassword == null) {
            return true;
        }
        return password.equals(confirmPassword);
    }
}
