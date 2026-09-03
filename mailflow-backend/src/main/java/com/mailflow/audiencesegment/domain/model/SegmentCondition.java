package com.mailflow.audiencesegment.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SegmentCondition {

    private String id;
    private String field;
    private String operator;
    private String value;
    private String fieldType;
}
