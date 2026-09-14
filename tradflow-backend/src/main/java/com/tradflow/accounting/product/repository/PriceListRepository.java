package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.PriceList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PriceListRepository extends JpaRepository<PriceList, UUID> {

    @Query("SELECT p FROM PriceList p WHERE (p.company.id = :companyId OR p.company IS NULL) AND p.active = true ORDER BY p.name ASC")
    List<PriceList> findAccessibleByCompany(@Param("companyId") UUID companyId);

    List<PriceList> findByCompanyIsNullAndActiveTrueOrderByNameAsc();

    boolean existsByCompanyIdAndNameIgnoreCase(UUID companyId, String name);

    boolean existsByCompanyIsNullAndNameIgnoreCase(String name);
}

