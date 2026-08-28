package com.mailflow.user.api.request;

import jakarta.validation.constraints.NotBlank;
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
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 128, message = "Mật khẩu mới phải có độ dài từ 8 đến 128 ký tự")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    private String confirmPassword;
}
