package com.tradflow.accounting.purchase.repository;

import com.tradflow.accounting.purchase.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PartyRepository extends JpaRepository<Party, UUID> {

    @Query("SELECT p FROM Party p WHERE p.active = true AND (p.company.id = :companyId OR p.company IS NULL) ORDER BY p.partyName ASC")
    List<Party> findAccessibleByCompany(@Param("companyId") UUID companyId);

    List<Party> findByCompanyIsNullAndActiveTrueOrderByPartyNameAsc();

    @Query("SELECT p FROM Party p WHERE p.active = true AND p.partyType = :partyType AND (p.company.id = :companyId OR p.company IS NULL) ORDER BY p.partyName ASC")
    List<Party> findAccessibleByCompanyAndType(@Param("companyId") UUID companyId, @Param("partyType") String partyType);
}

