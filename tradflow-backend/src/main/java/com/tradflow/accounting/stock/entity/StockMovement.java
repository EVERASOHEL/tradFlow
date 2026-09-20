package com.tradflow.accounting.stock.entity;

import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.product.entity.Product;
import com.tradflow.accounting.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "movement_type", nullable = false, length = 20)
    private String movementType; // 'IN', 'OUT', 'ADJUSTMENT'

    @Column(name = "reference_type", nullable = false, length = 30)
    private String referenceType; // 'PURCHASE', 'SALE', 'OPENING_STOCK', 'MANUAL_ADJUSTMENT'

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_cost", precision = 18, scale = 2)
    private BigDecimal unitCost;

    @Builder.Default
    @Column(name = "stock_before", nullable = false, precision = 18, scale = 3)
    private BigDecimal stockBefore = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "stock_after", nullable = false, precision = 18, scale = 3)
    private BigDecimal stockAfter = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

