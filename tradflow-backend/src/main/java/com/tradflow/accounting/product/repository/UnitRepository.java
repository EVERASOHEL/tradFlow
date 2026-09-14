package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {

    @Query("SELECT u FROM Unit u WHERE (u.company.id = :companyId OR u.company IS NULL) AND u.active = true ORDER BY u.name ASC")
    List<Unit> findAccessibleByCompany(@Param("companyId") UUID companyId);

    List<Unit> findByCompanyIsNullAndActiveTrueOrderByNameAsc();

    boolean existsByCompanyIdAndShortCodeIgnoreCase(UUID companyId, String shortCode);

    boolean existsByCompanyIsNullAndShortCodeIgnoreCase(String shortCode);
}

