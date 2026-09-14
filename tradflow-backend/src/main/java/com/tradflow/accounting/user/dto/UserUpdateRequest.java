package com.tradflow.accounting.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UserUpdateRequest {

    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Full name is required")
    @Size(max = 150)
    private String fullName;

    private String phone;
    private Boolean active;
    private Boolean accountLocked;

    @NotNull(message = "Role is required")
    private UUID roleId;
}
