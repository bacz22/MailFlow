package com.mailflow.audiencetag.api.request;

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
public class UpdateAudienceTagRequest {

    @Size(max = 80, message = "Tên thẻ không vượt quá 80 ký tự.")
    private String name;

    @Size(max = 200, message = "Màu thẻ không vượt quá 200 ký tự.")
    private String color;
}
