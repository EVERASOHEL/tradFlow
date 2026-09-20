package com.tradflow.accounting.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class StockDtos {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockItemSummary {
        private UUID productId;
        private String productCode;
        private String productName;
        private String categoryName;
        private String unitName;
        private String unitShortCode;
        private BigDecimal purchasePrice;
        private BigDecimal sellingPrice;
        private BigDecimal currentStock;
        private BigDecimal minimumStock;
        private BigDecimal reorderLevel;
        private Boolean isLowStock;
        private BigDecimal stockValue;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockMovementResponse {
        private UUID id;
        private UUID companyId;
        private UUID productId;
        private String productCode;
        private String productName;
        private String movementType; // IN, OUT, ADJUSTMENT
        private String referenceType; // PURCHASE, SALE, OPENING_STOCK, MANUAL_ADJUSTMENT
        private UUID referenceId;
        private BigDecimal quantity;
        private BigDecimal unitCost;
        private BigDecimal stockBefore;
        private BigDecimal stockAfter;
        private String notes;
        private String createdByName;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockAdjustmentRequest {
        private UUID companyId;
        private UUID productId;
        private BigDecimal newStock;
        private String reason;
    }
}

