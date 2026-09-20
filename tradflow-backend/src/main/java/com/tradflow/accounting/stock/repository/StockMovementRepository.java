package com.tradflow.accounting.stock.repository;

import com.tradflow.accounting.stock.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID>, JpaSpecificationExecutor<StockMovement> {

    List<StockMovement> findByCompanyIdAndProductIdOrderByCreatedAtDesc(UUID companyId, UUID productId);

    Page<StockMovement> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    List<StockMovement> findByReferenceTypeAndReferenceId(String referenceType, UUID referenceId);
}

