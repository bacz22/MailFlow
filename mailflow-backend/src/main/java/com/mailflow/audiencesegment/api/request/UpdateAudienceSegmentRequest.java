package com.mailflow.audiencesegment.api.request;

import com.mailflow.audiencesegment.domain.model.SegmentCondition;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAudienceSegmentRequest {

    @Size(max = 120, message = "Tên phân đoạn không vượt quá 120 ký tự.")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự.")
    private String description;

    private String matchLogic;

    private List<SegmentCondition> conditions;
}
