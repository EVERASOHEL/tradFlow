package com.tradflow.accounting.company.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignUserCompanyRequest {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotNull(message = "companyId is required")
    private UUID companyId;

    private Boolean isDefault;
}
