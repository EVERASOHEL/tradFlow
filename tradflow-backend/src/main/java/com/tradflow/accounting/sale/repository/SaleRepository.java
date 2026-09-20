package com.tradflow.accounting.sale.repository;

import com.tradflow.accounting.sale.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID>, JpaSpecificationExecutor<Sale> {

    boolean existsByCompanyIdAndInvoiceNumberIgnoreCase(UUID companyId, String invoiceNumber);

    Optional<Sale> findByCompanyIdAndInvoiceNumberIgnoreCase(UUID companyId, String invoiceNumber);

    Page<Sale> findByCompanyIdOrderByInvoiceDateDesc(UUID companyId, Pageable pageable);
}

