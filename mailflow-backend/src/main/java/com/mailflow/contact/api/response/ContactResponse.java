package com.mailflow.contact.api.response;

import com.mailflow.contact.domain.model.ContactCustomField;
import com.mailflow.contact.domain.model.ContactStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String company;
    private String phone;
    @Builder.Default
    private List<String> lists = new ArrayList<>();
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    private ContactStatus status;
    @Builder.Default
    private List<ContactCustomField> customFields = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
}
