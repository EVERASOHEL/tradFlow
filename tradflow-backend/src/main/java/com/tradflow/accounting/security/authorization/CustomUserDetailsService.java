package com.tradflow.accounting.security.authorization;

import com.tradflow.accounting.role.entity.RolePermission;
import com.tradflow.accounting.role.repository.RolePermissionRepository;
import com.tradflow.accounting.security.context.SecurityUser;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.entity.UserRole;
import com.tradflow.accounting.user.repository.UserRepository;
import com.tradflow.accounting.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return buildSecurityUser(user);
    }

    @Transactional(readOnly = true)
    public SecurityUser buildSecurityUser(User user) {
        Set<UserRole> userRoles = userRoleRepository.findByUserIdAndActiveTrue(user.getId())
                .stream().collect(Collectors.toSet());

        Set<String> roleCodes = userRoles.stream()
                .map(ur -> ur.getRole().getCode())
                .collect(Collectors.toSet());

        Set<String> permissionCodes = userRoles.stream()
                .flatMap(ur -> rolePermissionRepository.findByRoleId(ur.getRole().getId()).stream())
                .map(RolePermission::getPermission)
                .map(p -> p.getCode())
                .collect(Collectors.toSet());

        return new SecurityUser(user, roleCodes, permissionCodes);
    }
}
