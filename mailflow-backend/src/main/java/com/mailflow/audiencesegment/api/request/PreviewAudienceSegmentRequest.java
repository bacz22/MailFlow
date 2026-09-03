package com.mailflow.audiencesegment.api.request;

import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class PreviewAudienceSegmentRequest {

    @NotBlank(message = "Vui lòng chọn logic khớp (and/or).")
    private String matchLogic;

    @NotEmpty(message = "Phân đoạn cần ít nhất một điều kiện.")
    @Builder.Default
    private List<SegmentCondition> conditions = new ArrayList<>();

    private Integer page;
    private Integer size;
}
