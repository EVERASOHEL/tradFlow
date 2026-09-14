package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.ProductSubcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductSubcategoryRepository extends JpaRepository<ProductSubcategory, UUID> {

    @Query("SELECT s FROM ProductSubcategory s WHERE s.category.id = :categoryId AND (s.company.id = :companyId OR s.company IS NULL) AND s.active = true ORDER BY s.name ASC")
    List<ProductSubcategory> findByCategoryIdAndAccessibleCompany(@Param("categoryId") UUID categoryId, @Param("companyId") UUID companyId);

    List<ProductSubcategory> findByCategoryIdAndActiveTrueOrderByNameAsc(UUID categoryId);

    boolean existsByCompanyIdAndCodeIgnoreCase(UUID companyId, String code);

    boolean existsByCompanyIsNullAndCodeIgnoreCase(String code);
}

