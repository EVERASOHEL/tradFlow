package com.tradflow.accounting.product.repository;

import com.tradflow.accounting.product.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, UUID> {

    List<ProductPrice> findByProductIdAndActiveTrue(UUID productId);

    List<ProductPrice> findByPriceListIdAndActiveTrue(UUID priceListId);
}

