package com.tradflow.accounting.permission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PermissionRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 100)
    private String code;

    @NotBlank(message = "Name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Module is required")
    @Size(max = 50)
    private String module;

    private String description;
    private Boolean active;
}
