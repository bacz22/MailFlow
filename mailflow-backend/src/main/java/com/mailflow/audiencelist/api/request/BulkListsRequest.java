package com.mailflow.audiencelist.api.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BulkListsRequest {

    @NotEmpty(message = "Vui lòng chọn ít nhất một liên hệ.")
    @Size(max = 1000, message = "Tối đa 1000 liên hệ mỗi lần.")
    private List<UUID> ids;

    @NotNull(message = "Vui lòng chọn danh sách.")
    private UUID listId;
}
