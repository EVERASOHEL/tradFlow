package com.tradflow.accounting.purchase.entity;

import com.tradflow.accounting.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "purchase_items")
public class PurchaseItem {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false)
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Builder.Default
    @Column(name = "rate", nullable = false, precision = 18, scale = 2)
    private BigDecimal rate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.ZERO;

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
    @Column(name = "taxable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "packaging_type", length = 20)
    private String packagingType = "PIECE";

    @Builder.Default
    @Column(name = "pieces_per_box")
    private Integer piecesPerBox = 1;

    @Builder.Default
    @Column(name = "box_count", precision = 10, scale = 2)
    private BigDecimal boxCount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_pieces", precision = 18, scale = 3)
    private BigDecimal totalPieces = BigDecimal.ZERO;

    @Column(name = "length", precision = 10, scale = 2)
    private BigDecimal length;

    @Column(name = "width", precision = 10, scale = 2)
    private BigDecimal width;

    @Column(name = "height", precision = 10, scale = 2)
    private BigDecimal height;

    @Builder.Default
    @Column(name = "dimension_unit", length = 10)
    private String dimensionUnit = "CM";

    @Column(name = "net_weight", precision = 10, scale = 3)
    private BigDecimal netWeight;

    @Column(name = "gross_weight", precision = 10, scale = 3)
    private BigDecimal grossWeight;

    @Builder.Default
    @Column(name = "weight_unit", length = 10)
    private String weightUnit = "KG";

    @Builder.Default
    @Column(name = "total_cbm", precision = 10, scale = 4)
    private BigDecimal totalCbm = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_weight_kg", precision = 10, scale = 3)
    private BigDecimal totalWeightKg = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "unit_landed_cost", precision = 18, scale = 2)
    private BigDecimal unitLandedCost = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

