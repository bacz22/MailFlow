package com.mailflow.contact.api.request;

import com.mailflow.contact.domain.model.ContactCustomField;
import com.mailflow.contact.domain.model.ContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateContactRequest {

    @Size(max = 50, message = "Tên không vượt quá 50 ký tự.")
    private String firstName;

    @Size(max = 50, message = "Họ không vượt quá 50 ký tự.")
    private String lastName;

    @Email(message = "Định dạng email không hợp lệ.")
    @Size(max = 320)
    private String email;

    @Size(max = 40)
    private String phone;

    @Size(max = 160)
    private String company;

    private ContactStatus status;

    private List<String> tags;

    private List<ContactCustomField> customFields;

    private List<UUID> listIds;
}
