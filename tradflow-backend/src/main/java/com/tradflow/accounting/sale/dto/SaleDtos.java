package com.tradflow.accounting.sale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SaleDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleRequest {
        @NotNull(message = "Company ID is required")
        private UUID companyId;

        @NotBlank(message = "Invoice number is required")
        private String invoiceNumber;

        @NotNull(message = "Invoice date is required")
        private LocalDate invoiceDate;

        @NotNull(message = "Customer is required")
        private UUID customerId;

        @NotBlank(message = "Transaction type is required (GST or NON_GST)")
        private String transactionType; // 'GST' or 'NON_GST'

        private String paymentMode; // 'CASH', 'BANK', 'UPI', 'CREDIT'

        private BigDecimal otherCharges;
        private BigDecimal roundOff;
        private BigDecimal paidAmount;
        private String remarks;

        @NotEmpty(message = "At least one product line is required")
        private List<SaleItemRequest> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemRequest {
        @NotNull(message = "Product ID is required")
        private UUID productId;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;

        private BigDecimal discountPercent;
        private BigDecimal taxRate;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleResponse {
        private UUID id;
        private UUID companyId;
        private String companyName;
        private String invoiceNumber;
        private LocalDate invoiceDate;

        private UUID customerId;
        private String customerName;
        private String customerGstin;
        private String customerPhone;
        private String customerAddress;

        private String transactionType; // 'GST' or 'NON_GST'
        private String paymentMode;

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
        private String remarks;
        private String createdByName;
        private LocalDateTime createdAt;

        private List<SaleItemResponse> items;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleItemResponse {
        private UUID id;
        private UUID productId;
        private String productCode;
        private String productName;
        private String hsnCode;
        private String unitName;
        private String unitShortCode;

        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxableAmount;
        private BigDecimal taxRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal totalAmount;
    }
}

