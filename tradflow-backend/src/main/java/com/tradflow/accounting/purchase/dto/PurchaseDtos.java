package com.tradflow.accounting.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PurchaseDtos {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItemRequest {
        @NotNull(message = "Product ID is required")
        private UUID productId;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @NotNull(message = "Rate is required")
        private BigDecimal rate;

        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal taxableAmount;
        private BigDecimal totalAmount;

        private String packagingType;
        private Integer piecesPerBox;
        private BigDecimal boxCount;
        private BigDecimal totalPieces;
        private BigDecimal length;
        private BigDecimal width;
        private BigDecimal height;
        private String dimensionUnit;
        private BigDecimal netWeight;
        private BigDecimal grossWeight;
        private String weightUnit;
        private BigDecimal totalCbm;
        private BigDecimal totalWeightKg;
        private BigDecimal unitLandedCost;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseRequest {
        @NotNull(message = "Company ID is required")
        private UUID companyId;

        @NotBlank(message = "Purchase number is required")
        private String purchaseNumber;

        @NotNull(message = "Purchase date is required")
        private LocalDate purchaseDate;

        @NotNull(message = "Supplier ID is required")
        private UUID supplierId;

        private String supplierInvoiceNumber;
        private LocalDate supplierInvoiceDate;

        @NotBlank(message = "Transaction type is required (GST or NON_GST)")
        private String transactionType;

        private String currencyCode;
        private BigDecimal rmbPrice;
        private BigDecimal exchangeRate;
        private BigDecimal totalRmb;
        private String agentFeeBasis;
        private BigDecimal agentRate;
        private Integer totalBoxes;
        private BigDecimal totalCbm;
        private BigDecimal totalWeightKg;

        private BigDecimal otherCharges;
        private BigDecimal roundOff;
        private BigDecimal grandTotal;
        private BigDecimal paidAmount;

        @Builder.Default
        private String status = "CONFIRMED";

        private UUID importId;
        private String remarks;

        @NotEmpty(message = "At least one purchase item is required")
        @Valid
        private List<PurchaseItemRequest> items;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseItemResponse {
        private UUID id;
        private UUID productId;
        private String productCode;
        private String productName;
        private BigDecimal quantity;
        private BigDecimal rate;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal taxableAmount;
        private BigDecimal totalAmount;

        private String packagingType;
        private Integer piecesPerBox;
        private BigDecimal boxCount;
        private BigDecimal totalPieces;
        private BigDecimal length;
        private BigDecimal width;
        private BigDecimal height;
        private String dimensionUnit;
        private BigDecimal netWeight;
        private BigDecimal grossWeight;
        private String weightUnit;
        private BigDecimal totalCbm;
        private BigDecimal totalWeightKg;
        private BigDecimal unitLandedCost;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseResponse {
        private UUID id;
        private UUID companyId;
        private String companyName;
        private String purchaseNumber;
        private LocalDate purchaseDate;

        private UUID supplierId;
        private String supplierName;
        private String supplierCountry;

        private String supplierInvoiceNumber;
        private LocalDate supplierInvoiceDate;
        private String transactionType;

        private String currencyCode;
        private BigDecimal rmbPrice;
        private BigDecimal exchangeRate;
        private BigDecimal totalRmb;
        private String agentFeeBasis;
        private BigDecimal agentRate;
        private Integer totalBoxes;
        private BigDecimal totalCbm;
        private BigDecimal totalWeightKg;

        private BigDecimal subtotal;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal otherCharges;
        private BigDecimal roundOff;
        private BigDecimal grandTotal;
        private BigDecimal paidAmount;
        private BigDecimal outstandingAmount;

        private String status;
        private UUID importId;
        private String importNumber;
        private String remarks;

        private UUID createdById;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private List<PurchaseItemResponse> items;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierPurchaseSummary {
        private UUID supplierId;
        private String supplierName;
        private String tradeName;
        private String contactPerson;
        private String phone;
        private String email;
        private String country;
        private String currencyCode;
        private String gstin;
        private int totalInvoices;
        private BigDecimal totalPurchasedInr;
        private BigDecimal totalPurchasedRmb;
        private BigDecimal totalPaidInr;
        private BigDecimal outstandingDueInr;
        private Integer totalBoxes;
        private BigDecimal totalCbm;
        private LocalDate lastPurchaseDate;
    }
}

