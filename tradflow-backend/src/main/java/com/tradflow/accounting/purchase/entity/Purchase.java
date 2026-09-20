package com.tradflow.accounting.purchase.entity;

import com.tradflow.accounting.common.audit.Auditable;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "purchases")
public class Purchase extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "purchase_number", nullable = false, length = 50)
    private String purchaseNumber;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Party supplier;

    @Column(name = "supplier_invoice_number", length = 100)
    private String supplierInvoiceNumber;

    @Column(name = "supplier_invoice_date")
    private LocalDate supplierInvoiceDate;

    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType; // 'GST' or 'NON_GST'

    @Builder.Default
    @Column(name = "subtotal", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "taxable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cgst_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "sgst_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "igst_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "other_charges", nullable = false, precision = 18, scale = 2)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "round_off", nullable = false, precision = 18, scale = 2)
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "grand_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "outstanding_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "CONFIRMED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "import_id")
    private ImportShipment importShipment;

    @Builder.Default
    @Column(name = "currency_code", length = 10)
    private String currencyCode = "CNY";

    @Column(name = "rmb_price", precision = 18, scale = 4)
    private BigDecimal rmbPrice;

    @Column(name = "exchange_rate", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Builder.Default
    @Column(name = "total_rmb", precision = 18, scale = 2)
    private BigDecimal totalRmb = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "agent_fee_basis", length = 20)
    private String agentFeeBasis = "PER_RMB";

    @Builder.Default
    @Column(name = "agent_rate", precision = 18, scale = 4)
    private BigDecimal agentRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_boxes")
    private Integer totalBoxes = 0;

    @Builder.Default
    @Column(name = "total_cbm", precision = 10, scale = 4)
    private BigDecimal totalCbm = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_weight_kg", precision = 10, scale = 3)
    private BigDecimal totalWeightKg = BigDecimal.ZERO;

    @Column(name = "remarks")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();
}

