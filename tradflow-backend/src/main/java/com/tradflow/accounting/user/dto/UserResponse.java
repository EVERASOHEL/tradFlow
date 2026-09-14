package com.tradflow.accounting.user.dto;

import com.tradflow.accounting.permission.dto.PermissionSummary;
import com.tradflow.accounting.role.dto.RoleSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Boolean active;
    private Boolean accountLocked;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private List<RoleSummary> roles;
    private List<PermissionSummary> permissions;
}
