package com.tradflow.accounting.security.authorization;

import com.tradflow.accounting.common.exception.ForbiddenException;
import com.tradflow.accounting.company.repository.UserCompanyRepository;
import com.tradflow.accounting.security.context.CompanyContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Enforces multi-company data isolation: a user may only operate against
 * companies they have an active user_companies mapping for.
 */
@Service
@RequiredArgsConstructor
public class CompanyAccessService {

    private final UserCompanyRepository userCompanyRepository;
    private final AuthorizationService authorizationService;

    public boolean hasAccess(UUID userId, UUID companyId) {
        return userCompanyRepository.existsByUserIdAndCompanyId(userId, companyId);
    }

    /**
     * Returns the active company id from CompanyContext (set from the
     * X-Company-Id request header), verifying the current user has access to it.
     */
    public UUID requireActiveCompany() {
        UUID companyId = CompanyContext.get();
        if (companyId == null) {
            throw new ForbiddenException("X-Company-Id header is required for this operation");
        }
        UUID userId = authorizationService.getCurrentUserId();
        if (!hasAccess(userId, companyId)) {
            throw new ForbiddenException("You do not have access to company: " + companyId);
        }
        return companyId;
    }
}
