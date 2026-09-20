package com.tradflow.accounting.product.entity;

import com.tradflow.accounting.common.audit.Auditable;
import com.tradflow.accounting.company.entity.Company;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id")
    private ProductSubcategory subcategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model_no", length = 100)
    private String modelNo;

    @Column(name = "part_number", length = 100)
    private String partNumber;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id")
    private TaxRate taxRate;

    @Builder.Default
    @Column(name = "purchase_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "minimum_selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal minimumSellingPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "reorder_level", nullable = false, precision = 18, scale = 3)
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "minimum_stock", nullable = false, precision = 18, scale = 3)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @Column(name = "maximum_stock", precision = 18, scale = 3)
    private BigDecimal maximumStock;

    @Builder.Default
    @Column(name = "current_stock", nullable = false, precision = 18, scale = 3)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "description")
    private String description;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "specifications", columnDefinition = "jsonb")
    private Map<String, Object> specifications;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getPackagingConfiguration() {
        if (specifications == null) return null;
        if (specifications.get("packagingConfiguration") instanceof Map) {
            return (Map<String, Object>) specifications.get("packagingConfiguration");
        }
        if (specifications.get("packagingAndDimensions") instanceof Map) {
            return (Map<String, Object>) specifications.get("packagingAndDimensions");
        }
        return null;
    }

    public Integer getPiecesPerBox() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null && pkg.get("piecesPerBox") != null) {
            Object val = pkg.get("piecesPerBox");
            if (val instanceof Number) return ((Number) val).intValue();
            try { return Integer.parseInt(val.toString()); } catch (Exception ignored) {}
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public BigDecimal getBoxLength() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxLength") != null) {
                try { return new BigDecimal(pkg.get("boxLength").toString()); } catch (Exception ignored) {}
            }
            if (pkg.get("boxDimensions") instanceof Map) {
                Object val = ((Map<String, Object>) pkg.get("boxDimensions")).get("length");
                if (val != null) {
                    try { return new BigDecimal(val.toString()); } catch (Exception ignored) {}
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public BigDecimal getBoxWidth() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxWidth") != null) {
                try { return new BigDecimal(pkg.get("boxWidth").toString()); } catch (Exception ignored) {}
            }
            if (pkg.get("boxDimensions") instanceof Map) {
                Object val = ((Map<String, Object>) pkg.get("boxDimensions")).get("width");
                if (val != null) {
                    try { return new BigDecimal(val.toString()); } catch (Exception ignored) {}
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public BigDecimal getBoxHeight() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxHeight") != null) {
                try { return new BigDecimal(pkg.get("boxHeight").toString()); } catch (Exception ignored) {}
            }
            if (pkg.get("boxDimensions") instanceof Map) {
                Object val = ((Map<String, Object>) pkg.get("boxDimensions")).get("height");
                if (val != null) {
                    try { return new BigDecimal(val.toString()); } catch (Exception ignored) {}
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public String getDimensionUnit() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxDimensionUnit") != null) return pkg.get("boxDimensionUnit").toString();
            if (pkg.get("dimensionUnit") != null) return pkg.get("dimensionUnit").toString();
            if (pkg.get("boxDimensions") instanceof Map) {
                Object val = ((Map<String, Object>) pkg.get("boxDimensions")).get("unit");
                if (val != null) return val.toString();
            }
        }
        return "cm";
    }

    public BigDecimal getNetWeight() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null && pkg.get("pieceNetWeight") != null) {
            try { return new BigDecimal(pkg.get("pieceNetWeight").toString()); } catch (Exception ignored) {}
        }
        return null;
    }

    public BigDecimal getGrossWeight() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxGrossWeight") != null) {
                try { return new BigDecimal(pkg.get("boxGrossWeight").toString()); } catch (Exception ignored) {}
            }
            if (pkg.get("grossWeight") != null) {
                try { return new BigDecimal(pkg.get("grossWeight").toString()); } catch (Exception ignored) {}
            }
        }
        return null;
    }

    public String getWeightUnit() {
        Map<String, Object> pkg = getPackagingConfiguration();
        if (pkg != null) {
            if (pkg.get("boxWeightUnit") != null) return pkg.get("boxWeightUnit").toString();
            if (pkg.get("weightUnit") != null) return pkg.get("weightUnit").toString();
        }
        return "kg";
    }
}

