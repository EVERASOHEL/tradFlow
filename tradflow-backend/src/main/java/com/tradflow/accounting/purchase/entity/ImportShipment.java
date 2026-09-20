package com.tradflow.accounting.purchase.entity;

import com.tradflow.accounting.common.audit.Auditable;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "imports")
public class ImportShipment extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "import_number", nullable = false, length = 50)
    private String importNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Party supplier;

    @Column(name = "order_date")
    private LocalDate orderDate;

    @Builder.Default
    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode = "CNY";

    @Column(name = "rmb_price", precision = 18, scale = 4)
    private BigDecimal rmbPrice;

    @Column(name = "exchange_rate", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "total_rmb", precision = 18, scale = 2)
    private BigDecimal totalRmb;

    @Column(name = "total_purchase_value", precision = 18, scale = 2)
    private BigDecimal totalPurchaseValue;

    @Builder.Default
    @Column(name = "agent_fee_basis", length = 20)
    private String agentFeeBasis = "PER_RMB";

    @Column(name = "agent_rate", precision = 18, scale = 4)
    private BigDecimal agentRate;

    @Column(name = "agent_rate_per_rmb", precision = 18, scale = 4)
    private BigDecimal agentRatePerRmb;

    @Column(name = "agent_rate_per_kg", precision = 18, scale = 4)
    private BigDecimal agentRatePerKg;

    @Column(name = "agent_rate_per_cbm", precision = 18, scale = 4)
    private BigDecimal agentRatePerCbm;

    @Builder.Default
    @Column(name = "agent_charges", nullable = false, precision = 18, scale = 2)
    private BigDecimal agentCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_boxes")
    private Integer totalBoxes = 0;

    @Column(name = "silver_rate", precision = 18, scale = 2)
    private BigDecimal silverRate;

    @Column(name = "copper_rate", precision = 18, scale = 2)
    private BigDecimal copperRate;

    @Builder.Default
    @Column(name = "advance_percentage", precision = 5, scale = 2)
    private BigDecimal advancePercentage = new BigDecimal("30.00");

    @Builder.Default
    @Column(name = "advance_amount", precision = 18, scale = 2)
    private BigDecimal advanceAmount = BigDecimal.ZERO;

    @Column(name = "production_ready_date")
    private LocalDate productionReadyDate;

    @Column(name = "packing_list_date")
    private LocalDate packingListDate;

    @Column(name = "goods_loading_date")
    private LocalDate goodsLoadingDate;

    @Column(name = "port_arrival_date")
    private LocalDate portArrivalDate;

    @Column(name = "warehouse_arrival_date")
    private LocalDate warehouseArrivalDate;

    @Column(name = "customs_status", length = 30)
    private String customsStatus;

    @Column(name = "hold_reason")
    private String holdReason;

    @Builder.Default
    @Column(name = "transportation_expense", nullable = false, precision = 18, scale = 2)
    private BigDecimal transportationExpense = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_import_expense", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalImportExpense = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "landed_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal landedCost = BigDecimal.ZERO;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "remarks")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}

