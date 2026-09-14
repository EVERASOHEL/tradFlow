package com.tradflow.accounting.auth.service;

import com.tradflow.accounting.auth.dto.ChangePasswordRequest;
import com.tradflow.accounting.auth.dto.LoginRequest;
import com.tradflow.accounting.auth.dto.LoginResponse;
import com.tradflow.accounting.common.exception.BadRequestException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.common.exception.UnauthorizedException;
import com.tradflow.accounting.security.authorization.CustomUserDetailsService;
import com.tradflow.accounting.security.context.SecurityUser;
import com.tradflow.accounting.security.jwt.JwtProperties;
import com.tradflow.accounting.security.jwt.JwtTokenService;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtProperties jwtProperties;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (Boolean.TRUE.equals(user.getAccountLocked())) {
            throw new UnauthorizedException("Account is locked. Contact your administrator.");
        }
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            registerFailedLogin(user);
            throw new UnauthorizedException("Invalid username or password");
        }

        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SecurityUser securityUser = userDetailsService.buildSecurityUser(user);
        String accessToken = jwtTokenService.generateAccessToken(securityUser);
        String refreshToken = jwtTokenService.generateRefreshToken(securityUser);

        return LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtProperties.getAccessTokenExpiryMs())
                .roles(List.copyOf(securityUser.getRoleCodes()))
                .permissions(List.copyOf(securityUser.getPermissionCodes()))
                .build();
    }

    @Transactional
    public LoginResponse refresh(String refreshToken) {
        if (!jwtTokenService.isValid(refreshToken) || !jwtTokenService.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        UUID userId = jwtTokenService.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (!Boolean.TRUE.equals(user.getActive()) || Boolean.TRUE.equals(user.getAccountLocked())) {
            throw new UnauthorizedException("Account is inactive or locked");
        }

        SecurityUser securityUser = userDetailsService.buildSecurityUser(user);
        String newAccessToken = jwtTokenService.generateAccessToken(securityUser);
        String newRefreshToken = jwtTokenService.generateRefreshToken(securityUser);

        return LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresInMs(jwtProperties.getAccessTokenExpiryMs())
                .roles(List.copyOf(securityUser.getRoleCodes()))
                .permissions(List.copyOf(securityUser.getPermissionCodes()))
                .build();
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private void registerFailedLogin(User user) {
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setAccountLocked(true);
        }
        userRepository.save(user);
    }
}
