package com.tradflow.accounting.security.authorization;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Exposed as "@permissionService" so it can be referenced from
 * @PreAuthorize("@permissionService.has(authentication, 'USER_WRITE')") expressions.
 */
@Service("permissionService")
@RequiredArgsConstructor
public class PermissionService {

    public boolean has(Authentication authentication, String permissionCode) {
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(permissionCode));
    }

    public boolean hasAnyRole(Authentication authentication, String... roleCodes) {
        if (authentication == null) {
            return false;
        }
        for (String role : roleCodes) {
            String target = "ROLE_" + role;
            boolean match = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals(target));
            if (match) {
                return true;
            }
        }
        return false;
    }
}
