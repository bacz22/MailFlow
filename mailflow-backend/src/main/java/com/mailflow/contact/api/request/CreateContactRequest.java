package com.mailflow.contact.api.request;

import com.mailflow.contact.domain.model.ContactCustomField;
import com.mailflow.contact.domain.model.ContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateContactRequest {

    @NotBlank(message = "Vui lòng nhập tên.")
    @Size(max = 50, message = "Tên không vượt quá 50 ký tự.")
    private String firstName;

    @NotBlank(message = "Vui lòng nhập họ và tên đệm.")
    @Size(max = 50, message = "Họ không vượt quá 50 ký tự.")
    private String lastName;

    @NotBlank(message = "Vui lòng nhập địa chỉ email.")
    @Email(message = "Định dạng email không hợp lệ.")
    @Size(max = 320)
    private String email;

    @Size(max = 40)
    private String phone;

    @Size(max = 160)
    private String company;

    private ContactStatus status;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private List<ContactCustomField> customFields = new ArrayList<>();

    @Builder.Default
    private List<UUID> listIds = new ArrayList<>();
}
