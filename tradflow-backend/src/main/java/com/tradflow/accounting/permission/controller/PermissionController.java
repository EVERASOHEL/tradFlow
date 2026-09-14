package com.tradflow.accounting.permission.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.permission.dto.PermissionRequest;
import com.tradflow.accounting.permission.dto.PermissionResponse;
import com.tradflow.accounting.permission.service.PermissionCatalogService;
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
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    private final PermissionCatalogService permissionCatalogService;

    @PostMapping
    public ResponseEntity<ResultJson<PermissionResponse>> create(@Valid @RequestBody PermissionRequest request) {
        PermissionResponse response = permissionCatalogService.create(request);
        return CommonResponse.created(response, "Permission created");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultJson<PermissionResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(permissionCatalogService.getById(id));
    }

    @GetMapping
    public ResponseEntity<ResultJson<List<PermissionResponse>>> getAll() {
        return CommonResponse.getData(permissionCatalogService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResultJson<PermissionResponse>> update(@PathVariable UUID id,
                                                                    @Valid @RequestBody PermissionRequest request) {
        return CommonResponse.getData(permissionCatalogService.update(id, request), "Permission updated");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        permissionCatalogService.delete(id);
        return CommonResponse.getData((Void) null, "Permission deactivated");
    }
}
