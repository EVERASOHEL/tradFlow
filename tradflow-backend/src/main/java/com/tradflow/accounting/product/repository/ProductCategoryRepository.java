package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    @Query("SELECT c FROM ProductCategory c WHERE (c.company.id = :companyId OR c.company IS NULL) AND c.active = true ORDER BY c.name ASC")
    List<ProductCategory> findAccessibleByCompany(@Param("companyId") UUID companyId);

    List<ProductCategory> findByCompanyIsNullAndActiveTrueOrderByNameAsc();

    boolean existsByCompanyIdAndCodeIgnoreCase(UUID companyId, String code);

    boolean existsByCompanyIsNullAndCodeIgnoreCase(String code);
}

