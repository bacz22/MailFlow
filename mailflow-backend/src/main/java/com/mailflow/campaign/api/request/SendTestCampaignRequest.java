package com.mailflow.campaign.api.request;

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
public class SendTestCampaignRequest {

    @NotBlank(message = "Vui lòng nhập email nhận.")
    @Email(message = "Email nhận không hợp lệ.")
    @Size(max = 320)
    private String to;

    @Size(max = 80)
    private String firstName;

    @Size(max = 80)
    private String lastName;

    @Size(max = 160)
    private String company;

    @Size(max = 40)
    private String phone;
}
