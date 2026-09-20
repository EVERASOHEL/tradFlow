package com.tradflow.accounting.purchase.repository;

import com.tradflow.accounting.purchase.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, UUID>, JpaSpecificationExecutor<Purchase> {

    boolean existsByCompanyIdAndPurchaseNumberIgnoreCase(UUID companyId, String purchaseNumber);

    Optional<Purchase> findByCompanyIdAndPurchaseNumber(UUID companyId, String purchaseNumber);

    Page<Purchase> findByCompanyId(UUID companyId, Pageable pageable);

    List<Purchase> findByImportShipmentId(UUID importId);

    List<Purchase> findByCompanyIdOrderByPurchaseDateDesc(UUID companyId);

    List<Purchase> findByCompanyIdAndSupplierIdOrderByPurchaseDateDesc(UUID companyId, UUID supplierId);
}

