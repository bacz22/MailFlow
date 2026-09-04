package com.mailflow.emailsender.api.request;

import jakarta.validation.constraints.Email;
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
public class CreateEmailSenderRequest {

    @NotBlank(message = "Vui lòng nhập tên người gửi.")
    @Size(max = 160)
    private String name;

    @NotBlank(message = "Vui lòng nhập địa chỉ email.")
    @Email(message = "Email người gửi không hợp lệ.")
    @Size(max = 320)
    private String email;
}
