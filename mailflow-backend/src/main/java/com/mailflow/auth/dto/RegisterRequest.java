package com.mailflow.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class RegisterRequest {

    @NotBlank(message = "Vui lòng nhập tên")
    @Size(max = 50, message = "Tên không được quá 50 ký tự")
    private String firstName;

    @NotBlank(message = "Vui lòng nhập họ & tên đệm")
    @Size(max = 50, message = "Họ không được quá 50 ký tự")
    private String lastName;

    @NotBlank(message = "Vui lòng nhập địa chỉ email")
    @Email(message = "Địa chỉ email không đúng định dạng")
    @Size(max = 320, message = "Email không được quá 320 ký tự")
    private String email;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = ".*[A-Z].*", message = "Phải chứa ít nhất 1 chữ cái in hoa")
    @Pattern(regexp = ".*[0-9].*", message = "Phải chứa ít nhất 1 chữ số")
    @Pattern(regexp = ".*[^A-Za-z0-9].*", message = "Phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)")
    private String password;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu")
    private String confirmPassword;

    @NotNull(message = "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật")
    @AssertTrue(message = "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật")
    private Boolean acceptTerms;

    @AssertTrue(message = "Mật khẩu xác nhận không khớp")
    public boolean isPasswordMatching() {
        if (password == null || confirmPassword == null) {
            return true;
        }
        return password.equals(confirmPassword);
    }
}
