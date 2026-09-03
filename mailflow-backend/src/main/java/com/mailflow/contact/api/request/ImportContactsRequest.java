package com.mailflow.contact.api.request;

import com.mailflow.contact.domain.model.ContactCustomField;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class ImportContactsRequest {

    public enum DuplicateAction {
        SKIP,
        UPDATE
    }

    @NotNull
    @Builder.Default
    private DuplicateAction duplicateAction = DuplicateAction.SKIP;

    @Builder.Default
    private boolean skipInvalid = true;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Valid
    @NotEmpty(message = "Không có dòng dữ liệu để nạp.")
    @Size(max = 5000, message = "Mỗi lần nạp tối đa 5000 dòng.")
    private List<ImportContactRow> rows;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportContactRow {
        private String email;
        private String firstName;
        private String lastName;
        private String company;
        private String phone;
        @Builder.Default
        private List<ContactCustomField> customFields = new ArrayList<>();
    }
}
