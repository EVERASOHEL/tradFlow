package com.tradflow.accounting.company.repository;

import com.tradflow.accounting.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID>, JpaSpecificationExecutor<Company> {
    Optional<Company> findByCompanyCode(String companyCode);
    boolean existsByCompanyCode(String companyCode);
}
