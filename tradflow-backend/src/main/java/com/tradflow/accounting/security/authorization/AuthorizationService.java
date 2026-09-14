package com.tradflow.accounting.security.authorization;

import com.tradflow.accounting.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Helper for retrieving the current authenticated user's identity from the
 * SecurityContext. The JwtAuthenticationFilter sets the principal to the
 * user's UUID and the authorities to ROLE_* / permission-code strings.
 */
@Service
public class AuthorizationService {

    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("No authenticated user in context");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        throw new UnauthorizedException("Unexpected principal type: " + principal.getClass());
    }

    public boolean hasRole(String roleCode) {
        return getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + roleCode));
    }

    public boolean hasPermission(String permissionCode) {
        return getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(permissionCode));
    }

    private Authentication getAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new UnauthorizedException("No authenticated user in context");
        }
        return authentication;
    }
}
