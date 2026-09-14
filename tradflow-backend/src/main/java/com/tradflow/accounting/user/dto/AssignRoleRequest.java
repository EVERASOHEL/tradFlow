package com.tradflow.accounting.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignRoleRequest {

    @NotNull(message = "roleId is required")
    private UUID roleId;
}
