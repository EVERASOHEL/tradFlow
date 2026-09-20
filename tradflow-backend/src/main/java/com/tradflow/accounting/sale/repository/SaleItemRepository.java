package com.tradflow.accounting.sale.repository;

import com.tradflow.accounting.sale.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    List<SaleItem> findBySaleId(UUID saleId);
}

