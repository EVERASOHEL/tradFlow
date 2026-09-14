package com.tradflow.accounting.security.jwt;

import com.tradflow.accounting.security.context.CompanyContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Validates the JWT bearer token on every request, builds the Spring Security
 * authentication object from the token's embedded roles/permissions, and
 * sets the active company (from the X-Company-Id header) on CompanyContext
 * for the duration of the request.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String COMPANY_HEADER = "X-Company-Id";

    private final JwtTokenService jwtTokenService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = resolveToken(request);

            if (token != null && jwtTokenService.isValid(token) && !jwtTokenService.isRefreshToken(token)) {
                Claims claims = jwtTokenService.parseClaims(token);
                UUID userId = UUID.fromString(claims.getSubject());

                List<String> roles = jwtTokenService.getRoles(token);
                List<String> permissions = jwtTokenService.getPermissions(token);

                List<GrantedAuthority> authorities = Stream.concat(
                        roles == null ? Stream.<String>empty() : roles.stream().map(r -> "ROLE_" + r),
                        permissions == null ? Stream.<String>empty() : permissions.stream()
                ).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                String companyHeader = request.getHeader(COMPANY_HEADER);
                if (companyHeader != null && !companyHeader.isBlank()) {
                    CompanyContext.set(UUID.fromString(companyHeader));
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            CompanyContext.clear();
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
