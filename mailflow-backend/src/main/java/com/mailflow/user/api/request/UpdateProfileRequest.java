package com.mailflow.user.api.request;

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
public class UpdateProfileRequest {

    @NotBlank(message = "Vui lòng nhập tên")
    @Size(max = 50, message = "Tên không được quá 50 ký tự")
    private String firstName;

    @NotBlank(message = "Vui lòng nhập họ & tên đệm")
    @Size(max = 50, message = "Họ không được quá 50 ký tự")
    private String lastName;

    @Size(max = 30, message = "Số điện thoại không được quá 30 ký tự")
    @Pattern(regexp = "^$|^\\+?[0-9][0-9 ]*$", message = "Số điện thoại chỉ gồm dấu + và chữ số")
    private String phone;

    @Size(max = 120, message = "Chức danh không được quá 120 ký tự")
    private String jobTitle;
}
