package com.mailflow.audiencelist.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAudienceListRequest {

    @NotBlank(message = "Vui lòng nhập tên danh sách.")
    @Size(max = 120, message = "Tên danh sách không vượt quá 120 ký tự.")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự.")
    private String description;

    @Builder.Default
    private List<String> tags = new ArrayList<>();
}
