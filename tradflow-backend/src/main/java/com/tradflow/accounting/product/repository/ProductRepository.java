package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Query("SELECT p FROM Product p WHERE (p.company.id = :companyId OR p.company IS NULL) AND p.active = true")
    Page<Product> findAccessibleByCompany(@Param("companyId") UUID companyId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.company IS NULL AND p.active = true")
    Page<Product> findGlobalProducts(Pageable pageable);

    boolean existsByCompanyIdAndProductCodeIgnoreCase(UUID companyId, String productCode);

    boolean existsByCompanyIsNullAndProductCodeIgnoreCase(String productCode);

    long countByCompanyIdOrCompanyIsNull(UUID companyId);
}

