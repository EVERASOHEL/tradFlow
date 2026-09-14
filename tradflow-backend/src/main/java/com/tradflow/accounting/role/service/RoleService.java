package com.tradflow.accounting.role.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.permission.entity.Permission;
import com.tradflow.accounting.permission.repository.PermissionRepository;
import com.tradflow.accounting.role.dto.RoleRequest;
import com.tradflow.accounting.role.dto.RoleResponse;
import com.tradflow.accounting.role.entity.Role;
import com.tradflow.accounting.role.entity.RolePermission;
import com.tradflow.accounting.role.repository.RolePermissionRepository;
import com.tradflow.accounting.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    @Transactional
    public RoleResponse create(RoleRequest request) {
        if (roleRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Role code already exists: " + request.getCode());
        }
        Role role = Role.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        return toResponse(roleRepository.save(role));
    }

    @Transactional(readOnly = true)
    public RoleResponse getById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public RoleResponse update(UUID id, RoleRequest request) {
        Role role = findEntity(id);

        if (!role.getCode().equals(request.getCode()) && roleRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Role code already exists: " + request.getCode());
        }

        role.setCode(request.getCode());
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        if (request.getActive() != null) role.setActive(request.getActive());

        return toResponse(roleRepository.save(role));
    }

    @Transactional
    public void delete(UUID id) {
        Role role = findEntity(id);
        role.setActive(false);
        roleRepository.save(role);
    }

    @Transactional
    public void assignPermission(UUID roleId, UUID permissionId) {
        Role role = findEntity(roleId);
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> ResourceNotFoundException.of("Permission", permissionId));

        if (rolePermissionRepository.existsByRoleIdAndPermissionId(roleId, permissionId)) {
            throw new DuplicateResourceException("Role already has this permission");
        }

        RolePermission rolePermission = RolePermission.builder()
                .role(role)
                .permission(permission)
                .build();
        rolePermissionRepository.save(rolePermission);
    }

    private Role findEntity(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Role", id));
    }

    private RoleResponse toResponse(Role role) {
        List<String> permissions = rolePermissionRepository.findByRoleId(role.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .collect(Collectors.toList());

        return RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .active(role.getActive())
                .permissions(permissions)
                .build();
    }
}
