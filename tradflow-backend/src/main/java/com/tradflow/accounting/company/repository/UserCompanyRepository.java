package com.tradflow.accounting.company.repository;

import com.tradflow.accounting.company.entity.UserCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserCompanyRepository extends JpaRepository<UserCompany, UUID> {
    List<UserCompany> findByUserIdAndActiveTrue(UUID userId);
    Optional<UserCompany> findByUserIdAndCompanyId(UUID userId, UUID companyId);
    boolean existsByUserIdAndCompanyId(UUID userId, UUID companyId);
}
