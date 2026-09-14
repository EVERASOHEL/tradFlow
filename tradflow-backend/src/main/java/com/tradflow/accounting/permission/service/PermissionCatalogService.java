package com.tradflow.accounting.permission.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.permission.dto.PermissionRequest;
import com.tradflow.accounting.permission.dto.PermissionResponse;
import com.tradflow.accounting.permission.entity.Permission;
import com.tradflow.accounting.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD service for the permission master list.
 * Named PermissionCatalogService (not PermissionService) to avoid a Spring
 * bean-name collision with security.authorization.PermissionService, which
 * is registered under the bean name "permissionService" for @PreAuthorize SpEL use.
 */
@Service
@RequiredArgsConstructor
public class PermissionCatalogService {

    private final PermissionRepository permissionRepository;

    @Transactional
    public PermissionResponse create(PermissionRequest request) {
        if (permissionRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Permission code already exists: " + request.getCode());
        }
        Permission permission = Permission.builder()
                .code(request.getCode())
                .name(request.getName())
                .module(request.getModule())
                .description(request.getDescription())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        return toResponse(permissionRepository.save(permission));
    }

    @Transactional(readOnly = true)
    public PermissionResponse getById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getAll() {
        return permissionRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PermissionResponse update(UUID id, PermissionRequest request) {
        Permission permission = findEntity(id);

        if (!permission.getCode().equals(request.getCode())
                && permissionRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Permission code already exists: " + request.getCode());
        }

        permission.setCode(request.getCode());
        permission.setName(request.getName());
        permission.setModule(request.getModule());
        permission.setDescription(request.getDescription());
        if (request.getActive() != null) permission.setActive(request.getActive());

        return toResponse(permissionRepository.save(permission));
    }

    @Transactional
    public void delete(UUID id) {
        Permission permission = findEntity(id);
        permission.setActive(false);
        permissionRepository.save(permission);
    }

    private Permission findEntity(UUID id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Permission", id));
    }

    private PermissionResponse toResponse(Permission p) {
        return PermissionResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .module(p.getModule())
                .description(p.getDescription())
                .active(p.getActive())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
