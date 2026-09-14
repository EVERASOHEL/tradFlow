package com.tradflow.accounting.security.context;

import java.util.UUID;

/**
 * Holds the "active company" for the current request thread.
 * Populated by JwtAuthenticationFilter (or an X-Company-Id header interceptor)
 * and read by services/repositories that need to scope queries to a company.
 */
public final class CompanyContext {

    private static final ThreadLocal<UUID> ACTIVE_COMPANY = new ThreadLocal<>();

    private CompanyContext() {
    }

    public static void set(UUID companyId) {
        ACTIVE_COMPANY.set(companyId);
    }

    public static UUID get() {
        return ACTIVE_COMPANY.get();
    }

    public static void clear() {
        ACTIVE_COMPANY.remove();
    }
}
