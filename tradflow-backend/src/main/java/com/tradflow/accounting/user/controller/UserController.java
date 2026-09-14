package com.tradflow.accounting.user.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.user.dto.AssignRoleRequest;
import com.tradflow.accounting.user.dto.UserRequest;
import com.tradflow.accounting.user.dto.UserResponse;
import com.tradflow.accounting.user.dto.UserStatusRequest;
import com.tradflow.accounting.user.dto.UserUpdateRequest;
import com.tradflow.accounting.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<UserResponse>> create(@Valid @RequestBody UserRequest request) {
        UserResponse response = userService.create(request);
        return CommonResponse.created(response, "User created");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<UserResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(userService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<UserResponse>>> getAll() {
        return CommonResponse.getData(userService.getAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<UserResponse>> update(@PathVariable UUID id,
                                                             @Valid @RequestBody UserUpdateRequest request) {
        return CommonResponse.getData(userService.update(id, request), "User updated");
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<UserResponse>> updateStatus(@PathVariable UUID id,
                                                                 @Valid @RequestBody UserStatusRequest request) {
        String message = Boolean.TRUE.equals(request.getActive()) ? "User activated" : "User deactivated";
        return CommonResponse.getData(userService.updateStatus(id, request.getActive()), message);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        userService.delete(id);
        return CommonResponse.getData((Void) null, "User deactivated");
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> assignRole(@PathVariable UUID id,
                                                          @Valid @RequestBody AssignRoleRequest request) {
        userService.assignRole(id, request.getRoleId());
        return CommonResponse.getData((Void) null, "Role assigned to user");
    }
}
