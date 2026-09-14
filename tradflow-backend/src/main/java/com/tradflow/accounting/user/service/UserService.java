package com.tradflow.accounting.user.service;

import com.tradflow.accounting.common.exception.BadRequestException;
import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.permission.dto.PermissionSummary;
import com.tradflow.accounting.permission.entity.Permission;
import com.tradflow.accounting.role.dto.RoleSummary;
import com.tradflow.accounting.role.entity.Role;
import com.tradflow.accounting.role.entity.RolePermission;
import com.tradflow.accounting.role.repository.RolePermissionRepository;
import com.tradflow.accounting.role.repository.RoleRepository;
import com.tradflow.accounting.user.dto.UserRequest;
import com.tradflow.accounting.user.dto.UserResponse;
import com.tradflow.accounting.user.dto.UserUpdateRequest;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.entity.UserRole;
import com.tradflow.accounting.user.repository.UserRepository;
import com.tradflow.accounting.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    static final String ADMIN_ROLE_CODE = "ADMIN";

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .accountLocked(false)
                .failedLoginAttempts(0)
                .passwordChangedAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        replaceActiveRole(saved, request.getRoleId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = findEntity(id);

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        boolean becomingInactive = Boolean.FALSE.equals(request.getActive());
        boolean becomingLocked = Boolean.TRUE.equals(request.getAccountLocked());
        if ((becomingInactive || becomingLocked) && isLastActiveAdmin(user)) {
            throw new BadRequestException("Cannot deactivate or lock the last active administrator");
        }

        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getAccountLocked() != null) {
            user.setAccountLocked(request.getAccountLocked());
            if (Boolean.FALSE.equals(request.getAccountLocked())) {
                user.setFailedLoginAttempts(0);
            }
        }

        replaceActiveRole(user, request.getRoleId());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateStatus(UUID id, boolean active) {
        User user = findEntity(id);
        if (!active && isLastActiveAdmin(user)) {
            throw new BadRequestException("Cannot deactivate the last active administrator");
        }
        user.setActive(active);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(UUID id) {
        updateStatus(id, false);
    }

    @Transactional
    public void assignRole(UUID userId, UUID roleId) {
        User user = findEntity(userId);
        replaceActiveRole(user, roleId);
    }

    private void replaceActiveRole(User user, UUID roleId) {
        Role role = requireActiveRole(roleId);
        if (isLastActiveAdmin(user) && !ADMIN_ROLE_CODE.equals(role.getCode())) {
            throw new BadRequestException("Cannot remove the administrator role from the last active administrator");
        }

        List<UserRole> existing = userRoleRepository.findByUserId(user.getId());
        boolean matched = false;
        for (UserRole userRole : existing) {
            boolean sameRole = userRole.getRole().getId().equals(roleId);
            userRole.setActive(sameRole);
            userRoleRepository.save(userRole);
            if (sameRole) {
                matched = true;
            }
        }

        if (!matched) {
            userRoleRepository.save(UserRole.builder()
                    .user(user)
                    .role(role)
                    .active(true)
                    .build());
        }
    }

    private Role requireActiveRole(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> ResourceNotFoundException.of("Role", roleId));
        if (!Boolean.TRUE.equals(role.getActive())) {
            throw new BadRequestException("Role is inactive: " + role.getCode());
        }
        return role;
    }

    private boolean isLastActiveAdmin(User user) {
        if (!Boolean.TRUE.equals(user.getActive()) || Boolean.TRUE.equals(user.getAccountLocked())) {
            return false;
        }
        boolean hasAdminRole = userRoleRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .anyMatch(userRole -> ADMIN_ROLE_CODE.equals(userRole.getRole().getCode())
                        && Boolean.TRUE.equals(userRole.getRole().getActive()));
        if (!hasAdminRole) {
            return false;
        }
        return userRoleRepository.countActiveUnlockedUsersWithRole(ADMIN_ROLE_CODE) <= 1;
    }

    private User findEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("User", id));
    }

    private UserResponse toResponse(User user) {
        List<UserRole> activeRoles = userRoleRepository.findByUserIdAndActiveTrue(user.getId());
        List<RoleSummary> roles = activeRoles.stream()
                .map(UserRole::getRole)
                .map(role -> RoleSummary.builder()
                        .id(role.getId())
                        .code(role.getCode())
                        .name(role.getName())
                        .build())
                .toList();

        Map<UUID, PermissionSummary> permissionsById = new LinkedHashMap<>();
        for (UserRole userRole : activeRoles) {
            for (RolePermission rolePermission : rolePermissionRepository.findByRoleId(userRole.getRole().getId())) {
                Permission permission = rolePermission.getPermission();
                if (permission == null || !Boolean.TRUE.equals(permission.getActive())) {
                    continue;
                }
                permissionsById.putIfAbsent(permission.getId(), PermissionSummary.builder()
                        .id(permission.getId())
                        .code(permission.getCode())
                        .name(permission.getName())
                        .module(permission.getModule())
                        .build());
            }
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .active(user.getActive())
                .accountLocked(user.getAccountLocked())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .permissions(new ArrayList<>(permissionsById.values()))
                .build();
    }
}
