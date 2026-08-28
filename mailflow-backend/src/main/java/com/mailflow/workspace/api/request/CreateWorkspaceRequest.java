package com.mailflow.workspace.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkspaceRequest {

    @NotBlank(message = "Vui lòng nhập tên workspace")
    @Size(max = 120, message = "Tên workspace không được quá 120 ký tự")
    private String name;
}
