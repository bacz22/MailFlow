package com.mailflow.audiencetag.api.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SyncTagsResponse {

    private int created;
    private List<AudienceTagResponse> tags = new ArrayList<>();
}
