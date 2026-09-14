package com.tradflow.accounting.security.context;

import com.tradflow.accounting.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
public class SecurityUser implements UserDetails {

    private final UUID userId;
    private final String username;
    private final String passwordHash;
    private final boolean active;
    private final boolean accountLocked;
    private final Set<String> roleCodes;
    private final Set<String> permissionCodes;

    public SecurityUser(User user, Set<String> roleCodes, Set<String> permissionCodes) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.passwordHash = user.getPasswordHash();
        this.active = Boolean.TRUE.equals(user.getActive());
        this.accountLocked = Boolean.TRUE.equals(user.getAccountLocked());
        this.roleCodes = roleCodes;
        this.permissionCodes = permissionCodes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Roles are exposed as ROLE_<code> (for hasRole()), permissions as raw codes (for hasAuthority())
        return java.util.stream.Stream.concat(
                roleCodes.stream().map(r -> "ROLE_" + r),
                permissionCodes.stream()
        ).map(SimpleGrantedAuthority::new).collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !accountLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
