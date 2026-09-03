package com.mailflow.contact.api.request;

import jakarta.validation.constraints.NotEmpty;
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
public class BulkTagsRequest {

    @NotEmpty(message = "Vui lòng chọn ít nhất một liên hệ.")
    @Size(max = 1000, message = "Tối đa 1000 liên hệ mỗi lần.")
    private List<UUID> ids;

    @NotEmpty(message = "Vui lòng nhập ít nhất một thẻ.")
    @Size(max = 20, message = "Tối đa 20 thẻ mỗi lần.")
    private List<String> tags;
}
