package com.tradflow.accounting.role.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.role.dto.AssignPermissionRequest;
import com.tradflow.accounting.role.dto.RoleRequest;
import com.tradflow.accounting.role.dto.RoleResponse;
import com.tradflow.accounting.role.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    public ResponseEntity<ResultJson<RoleResponse>> create(@Valid @RequestBody RoleRequest request) {
        RoleResponse response = roleService.create(request);
        return CommonResponse.created(response, "Role created");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultJson<RoleResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(roleService.getById(id));
    }

    @GetMapping
    public ResponseEntity<ResultJson<List<RoleResponse>>> getAll() {
        return CommonResponse.getData(roleService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResultJson<RoleResponse>> update(@PathVariable UUID id,
                                                             @Valid @RequestBody RoleRequest request) {
        return CommonResponse.getData(roleService.update(id, request), "Role updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        roleService.delete(id);
        return CommonResponse.getData((Void) null, "Role deactivated");
    }

    @PostMapping("/{id}/permissions")
    public ResponseEntity<ResultJson<Void>> assignPermission(@PathVariable UUID id,
                                                                @Valid @RequestBody AssignPermissionRequest request) {
        roleService.assignPermission(id, request.getPermissionId());
        return CommonResponse.getData((Void) null, "Permission assigned to role");
    }
}
