package com.mailflow.audiencesegment.api.request;

import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class CreateAudienceSegmentRequest {

    @NotBlank(message = "Vui lòng nhập tên phân đoạn.")
    @Size(max = 120, message = "Tên phân đoạn không vượt quá 120 ký tự.")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự.")
    private String description;

    @NotBlank(message = "Vui lòng chọn logic khớp (and/or).")
    private String matchLogic;

    @NotEmpty(message = "Phân đoạn cần ít nhất một điều kiện.")
    @Builder.Default
    private List<SegmentCondition> conditions = new ArrayList<>();
}
