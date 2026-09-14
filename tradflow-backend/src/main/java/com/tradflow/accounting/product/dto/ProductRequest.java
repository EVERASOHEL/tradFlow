package com.tradflow.accounting.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    private UUID companyId; // Null for global master

    @NotBlank(message = "Product code is required")
    @Size(max = 50, message = "Product code cannot exceed 50 characters")
    private String productCode;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name cannot exceed 200 characters")
    private String productName;

    private UUID categoryId;
    private UUID subcategoryId;
    private UUID unitId;
    private UUID taxRateId;

    @Size(max = 100)
    private String brand;

    @Size(max = 100)
    private String modelNo;

    @Size(max = 100)
    private String partNumber;

    @Size(max = 20)
    private String hsnCode;

    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal minimumSellingPrice;
    private BigDecimal reorderLevel;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private String description;
    private Boolean active;
}

