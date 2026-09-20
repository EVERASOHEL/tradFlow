package com.tradflow.accounting.purchase.repository;

import com.tradflow.accounting.purchase.entity.ImportShipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportRepository extends JpaRepository<ImportShipment, UUID>, JpaSpecificationExecutor<ImportShipment> {

    boolean existsByCompanyIdAndImportNumberIgnoreCase(UUID companyId, String importNumber);

    Optional<ImportShipment> findByCompanyIdAndImportNumber(UUID companyId, String importNumber);

    Page<ImportShipment> findByCompanyId(UUID companyId, Pageable pageable);
}

