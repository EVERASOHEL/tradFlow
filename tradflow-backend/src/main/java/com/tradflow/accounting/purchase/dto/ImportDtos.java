package com.tradflow.accounting.purchase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ImportDtos {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportCreateRequest {
        @NotNull(message = "Company ID is required")
        private UUID companyId;

        @NotBlank(message = "Import number is required")
        private String importNumber;

        private UUID supplierId;
        private LocalDate orderDate;

        @Builder.Default
        private String currencyCode = "CNY";

        private BigDecimal rmbPrice;
        private BigDecimal exchangeRate;
        private BigDecimal totalRmb;
        private BigDecimal totalPurchaseValue;
        private String agentFeeBasis;
        private BigDecimal agentRate;
        private BigDecimal agentRatePerRmb;
        private BigDecimal agentRatePerKg;
        private BigDecimal agentRatePerCbm;
        private BigDecimal agentCharges;
        private Integer totalBoxes;
        private BigDecimal silverRate;
        private BigDecimal copperRate;
        private BigDecimal advancePercentage;
        private BigDecimal advanceAmount;

        // Optional initial stage dates
        private LocalDate productionReadyDate;
        private LocalDate packingListDate;
        private LocalDate goodsLoadingDate;
        private LocalDate portArrivalDate;
        private LocalDate warehouseArrivalDate;

        private String customsStatus;
        private String holdReason;
        private BigDecimal transportationExpense;
        private BigDecimal totalImportExpense;
        private BigDecimal landedCost;

        @Builder.Default
        private String status = "ORDERED";

        private String remarks;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportStageUpdateRequest {
        private LocalDate orderDate;
        private BigDecimal rmbPrice;
        private BigDecimal exchangeRate;
        private BigDecimal totalRmb;
        private BigDecimal totalPurchaseValue;
        private String agentFeeBasis;
        private BigDecimal agentRate;
        private BigDecimal agentRatePerRmb;
        private BigDecimal agentRatePerKg;
        private BigDecimal agentRatePerCbm;
        private BigDecimal agentCharges;
        private Integer totalBoxes;
        private BigDecimal silverRate;
        private BigDecimal copperRate;
        private BigDecimal advancePercentage;
        private BigDecimal advanceAmount;

        private LocalDate productionReadyDate;
        private LocalDate packingListDate;
        private LocalDate goodsLoadingDate;
        private LocalDate portArrivalDate;
        private LocalDate warehouseArrivalDate;

        private String customsStatus;
        private String holdReason;
        private BigDecimal transportationExpense;
        private BigDecimal totalImportExpense;
        private BigDecimal landedCost;

        private String status;
        private String remarks;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportResponse {
        private UUID id;
        private UUID companyId;
        private String companyName;
        private String importNumber;

        private UUID supplierId;
        private String supplierName;
        private String supplierCountry;

        private LocalDate orderDate;
        private String currencyCode;
        private BigDecimal rmbPrice;
        private BigDecimal exchangeRate;
        private BigDecimal totalRmb;
        private BigDecimal totalPurchaseValue;

        private String agentFeeBasis;
        private BigDecimal agentRate;
        private BigDecimal agentRatePerRmb;
        private BigDecimal agentRatePerKg;
        private BigDecimal agentRatePerCbm;
        private BigDecimal agentCharges;
        private Integer totalBoxes;
        private BigDecimal silverRate;
        private BigDecimal copperRate;
        private BigDecimal advancePercentage;
        private BigDecimal advanceAmount;

        private LocalDate productionReadyDate;
        private LocalDate packingListDate;
        private LocalDate goodsLoadingDate;
        private LocalDate portArrivalDate;
        private LocalDate warehouseArrivalDate;

        private String customsStatus;
        private String holdReason;
        private BigDecimal transportationExpense;
        private BigDecimal totalImportExpense;
        private BigDecimal landedCost;

        private String status;
        private String remarks;

        private UUID createdById;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketRatesResponse {
        private BigDecimal exchangeRate;  // INR per RMB (CNY to INR)
        private BigDecimal silverRate;    // ₹/kg
        private BigDecimal copperRate;    // ₹/kg
        private BigDecimal usdInrRate;    // USD to INR
        private BigDecimal silverUsdOz;   // USD/troy oz (COMEX SI=F)
        private BigDecimal copperUsdLb;   // USD/lb (COMEX HG=F)
        private String lastUpdated;       // ISO timestamp or formatted
        private String status;            // LIVE, CACHED, FALLBACK
    }
}

