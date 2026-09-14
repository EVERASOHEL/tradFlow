package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {

    @Query("SELECT t FROM TaxRate t WHERE (t.company.id = :companyId OR t.company IS NULL) AND t.active = true ORDER BY t.gstRate ASC")
    List<TaxRate> findAccessibleByCompany(@Param("companyId") UUID companyId);

    List<TaxRate> findByCompanyIsNullAndActiveTrueOrderByGstRateAsc();

    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);

    boolean existsByCompanyIsNullAndNameIgnoreCase(String name);
}

