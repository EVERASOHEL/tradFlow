package com.tradflow.accounting.role.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignPermissionRequest {

    @NotNull(message = "permissionId is required")
    private UUID permissionId;
}
