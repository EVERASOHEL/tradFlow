package com.tradflow.accounting.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private UUID id;
    private UUID companyId;
    private String companyName;
    private Boolean isGlobal;

    private String productCode;
    private String productName;

    private UUID categoryId;
    private String categoryName;
    private String categoryCode;

    private UUID subcategoryId;
    private String subcategoryName;

    private UUID unitId;
    private String unitName;
    private String unitShortCode;

    private UUID taxRateId;
    private String taxRateName;
    private BigDecimal gstRate;

    private String brand;
    private String modelNo;
    private String partNumber;
    private String hsnCode;

    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal minimumSellingPrice;
    private BigDecimal reorderLevel;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private String description;
    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

