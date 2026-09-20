package com.tradflow.accounting.sale.entity;

import com.tradflow.accounting.common.audit.Auditable;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.purchase.entity.Party;
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
@Table(name = "sales")
public class Sale extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Party customer;

    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType; // 'GST' or 'NON_GST'

    @Builder.Default
    @Column(name = "payment_mode", nullable = false, length = 30)
    private String paymentMode = "CREDIT"; // 'CASH', 'BANK', 'UPI', 'CREDIT'

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
    private String status = "CONFIRMED"; // 'CONFIRMED', 'CANCELLED'

    @Column(name = "remarks")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();
}

