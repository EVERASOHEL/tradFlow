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

public class ProductMasterDtos {

    // Category
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRequest {
        private UUID companyId;
        @NotBlank(message = "Category name is required")
        private String name;
        @NotBlank(message = "Category code is required")
        private String code;
        private String description;
        private Boolean active;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryResponse {
        private UUID id;
        private UUID companyId;
        private String name;
        private String code;
        private String description;
        private Boolean active;
        private Boolean isGlobal;
    }

    // Subcategory
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubcategoryRequest {
        private UUID companyId;
        private UUID categoryId;
        @NotBlank(message = "Subcategory name is required")
        private String name;
        @NotBlank(message = "Subcategory code is required")
        private String code;
        private Boolean active;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubcategoryResponse {
        private UUID id;
        private UUID companyId;
        private UUID categoryId;
        private String categoryName;
        private String name;
        private String code;
        private Boolean active;
        private Boolean isGlobal;
    }

    // Unit
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitRequest {
        private UUID companyId;
        @NotBlank(message = "Unit name is required")
        private String name;
        @NotBlank(message = "Short code is required")
        private String shortCode;
        private Boolean decimalAllowed;
        private Boolean active;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitResponse {
        private UUID id;
        private UUID companyId;
        private String name;
        private String shortCode;
        private Boolean decimalAllowed;
        private Boolean active;
        private Boolean isGlobal;
    }

    // TaxRate
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxRateRequest {
        private UUID companyId;
        @NotBlank(message = "Tax name is required")
        private String name;
        private BigDecimal gstRate;
        private BigDecimal cgstRate;
        private BigDecimal sgstRate;
        private BigDecimal igstRate;
        private Boolean active;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxRateResponse {
        private UUID id;
        private UUID companyId;
        private String name;
        private BigDecimal gstRate;
        private BigDecimal cgstRate;
        private BigDecimal sgstRate;
        private BigDecimal igstRate;
        private Boolean active;
        private Boolean isGlobal;
    }
}

