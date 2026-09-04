package com.mailflow.emailsender.api.request;

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
public class UpdateEmailSenderRequest {

    @Size(max = 160)
    private String name;

    @Size(max = 20)
    private String status;
}
