package com.mailflow.workspace.api.request;

import com.mailflow.workspace.domain.model.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
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
public class UpdateMemberRoleRequest {

    @NotNull(message = "Vui lòng chọn vai trò")
    private WorkspaceRole role;
}
