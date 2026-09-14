package com.tradflow.accounting.auth.controller;

import com.tradflow.accounting.auth.dto.ChangePasswordRequest;
import com.tradflow.accounting.auth.dto.LoginRequest;
import com.tradflow.accounting.auth.dto.LoginResponse;
import com.tradflow.accounting.auth.dto.RefreshTokenRequest;
import com.tradflow.accounting.auth.service.AuthService;
import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.security.authorization.AuthorizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthorizationService authorizationService;

//    http://localhost:8888/swagger-ui/index.html#/auth-controller/login

    @PostMapping("/login")
    public ResponseEntity<ResultJson<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return CommonResponse.getData(response, "Login successful");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ResultJson<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refresh(request.getRefreshToken());
        return CommonResponse.getData(response, "Token refreshed");
    }

    @PostMapping("/change-password")
    public ResponseEntity<ResultJson<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authorizationService.getCurrentUserId(), request);
        return CommonResponse.getData((Void) null, "Password changed successfully");
    }
}
