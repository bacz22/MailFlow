package com.mailflow.contact.api.response;

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
public class ImportContactsResponse {

    private int created;
    private int updated;
    private int skipped;
    private int invalid;
    @Builder.Default
    private List<ImportError> errors = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportError {
        private int row;
        private String email;
        private String reason;
    }
}
