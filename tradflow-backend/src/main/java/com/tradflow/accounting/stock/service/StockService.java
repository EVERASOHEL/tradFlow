package com.tradflow.accounting.stock.service;

import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.product.entity.Product;
import com.tradflow.accounting.product.repository.ProductRepository;
import com.tradflow.accounting.purchase.entity.Purchase;
import com.tradflow.accounting.purchase.entity.PurchaseItem;
import com.tradflow.accounting.stock.dto.StockDtos.*;
import com.tradflow.accounting.stock.entity.StockMovement;
import com.tradflow.accounting.stock.repository.StockMovementRepository;
import com.tradflow.accounting.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CompanyRepository companyRepository;

    /**
     * Add stock when a purchase invoice is confirmed.
     */
    @Transactional
    public void addStockForPurchase(Purchase purchase, List<PurchaseItem> items, User user) {
        if (items == null || items.isEmpty()) return;

        Company company = purchase.getCompany();

        for (PurchaseItem item : items) {
            Product product = item.getProduct();
            if (product == null) continue;

            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            if (qty.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal stockAfter = stockBefore.add(qty);

            product.setCurrentStock(stockAfter);
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .company(company)
                    .product(product)
                    .movementType("IN")
                    .referenceType("PURCHASE")
                    .referenceId(purchase.getId())
                    .quantity(qty)
                    .unitCost(item.getRate())
                    .stockBefore(stockBefore)
                    .stockAfter(stockAfter)
                    .notes("Purchase Invoice #" + purchase.getPurchaseNumber() + " received from Supplier: "
                            + (purchase.getSupplier() != null ? purchase.getSupplier().getPartyName() : "Supplier"))
                    .createdBy(user)
                    .build();

            stockMovementRepository.save(movement);
            log.info("Stock IN: Product {} +{} units (balance: {}) from Purchase #{}",
                    product.getProductCode(), qty, stockAfter, purchase.getPurchaseNumber());
        }
    }

    /**
     * Deduct / reverse stock when a purchase invoice is deleted or cancelled.
     */
    @Transactional
    public void reverseStockForPurchase(Purchase purchase, User user) {
        Company company = purchase.getCompany();
        if (purchase.getItems() == null) return;

        for (PurchaseItem item : purchase.getItems()) {
            Product product = item.getProduct();
            if (product == null) continue;

            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            if (qty.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal stockAfter = stockBefore.subtract(qty);
            if (stockAfter.compareTo(BigDecimal.ZERO) < 0) stockAfter = BigDecimal.ZERO;

            product.setCurrentStock(stockAfter);
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .company(company)
                    .product(product)
                    .movementType("OUT")
                    .referenceType("PURCHASE")
                    .referenceId(purchase.getId())
                    .quantity(qty)
                    .unitCost(item.getRate())
                    .stockBefore(stockBefore)
                    .stockAfter(stockAfter)
                    .notes("Reversal of deleted Purchase Invoice #" + purchase.getPurchaseNumber())
                    .createdBy(user)
                    .build();

            stockMovementRepository.save(movement);
            log.info("Stock OUT (Reversal): Product {} -{} units (balance: {}) for deleted Purchase #{}",
                    product.getProductCode(), qty, stockAfter, purchase.getPurchaseNumber());
        }
    }

    /**
     * Record a raw stock movement and update product current stock.
     */
    @Transactional
    public StockMovement recordMovement(
            Company company,
            Product product,
            String movementType,
            String referenceType,
            UUID referenceId,
            BigDecimal quantity,
            BigDecimal unitCost,
            String notes,
            User user
    ) {
        BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal stockAfter;

        if ("IN".equalsIgnoreCase(movementType)) {
            stockAfter = stockBefore.add(quantity);
        } else if ("OUT".equalsIgnoreCase(movementType)) {
            stockAfter = stockBefore.subtract(quantity);
        } else {
            // ADJUSTMENT - sets to new target or offsets
            stockAfter = stockBefore.add(quantity);
        }

        product.setCurrentStock(stockAfter);
        productRepository.save(product);

        StockMovement movement = StockMovement.builder()
                .company(company)
                .product(product)
                .movementType(movementType.toUpperCase())
                .referenceType(referenceType.toUpperCase())
                .referenceId(referenceId)
                .quantity(quantity.abs())
                .unitCost(unitCost)
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .notes(notes)
                .createdBy(user)
                .build();

        return stockMovementRepository.save(movement);
    }

    /**
     * Get stock inventory summary for products in a company.
     */
    @Transactional(readOnly = true)
    public Page<StockItemSummary> getStockSummary(UUID companyId, String search, Boolean lowStockOnly, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("company").get("id"), companyId),
                        cb.isNull(root.get("company"))
                ));
            }

            predicates.add(cb.isTrue(root.get("active")));

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("productCode")), pattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("productName")), pattern);
                predicates.add(cb.or(codeMatch, nameMatch));
            }

            if (Boolean.TRUE.equals(lowStockOnly)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentStock"), root.get("reorderLevel")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(this::toStockItemSummary);
    }

    /**
     * Get stock movements audit ledger.
     */
    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getMovements(UUID companyId, UUID productId, String movementType, Pageable pageable) {
        Specification<StockMovement> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (productId != null) {
                predicates.add(cb.equal(root.get("product").get("id"), productId));
            }

            if (movementType != null && !movementType.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("movementType")), movementType.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return stockMovementRepository.findAll(spec, pageable).map(this::toMovementResponse);
    }

    /**
     * Manual stock adjustment.
     */
    @Transactional
    public StockMovementResponse adjustStock(StockAdjustmentRequest request, User user) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal stockAfter = request.getNewStock() != null ? request.getNewStock() : BigDecimal.ZERO;
        BigDecimal diff = stockAfter.subtract(stockBefore);

        product.setCurrentStock(stockAfter);
        productRepository.save(product);

        StockMovement movement = StockMovement.builder()
                .company(company)
                .product(product)
                .movementType(diff.compareTo(BigDecimal.ZERO) >= 0 ? "IN" : "OUT")
                .referenceType("MANUAL_ADJUSTMENT")
                .quantity(diff.abs())
                .unitCost(product.getPurchasePrice())
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .notes(request.getReason() != null ? request.getReason() : "Manual inventory stock adjustment")
                .createdBy(user)
                .build();

        StockMovement saved = stockMovementRepository.save(movement);
        return toMovementResponse(saved);
    }

    private StockItemSummary toStockItemSummary(Product p) {
        BigDecimal stock = p.getCurrentStock() != null ? p.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal reorder = p.getReorderLevel() != null ? p.getReorderLevel() : BigDecimal.ZERO;
        BigDecimal price = p.getPurchasePrice() != null ? p.getPurchasePrice() : BigDecimal.ZERO;

        return StockItemSummary.builder()
                .productId(p.getId())
                .productCode(p.getProductCode())
                .productName(p.getProductName())
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .unitName(p.getUnit() != null ? p.getUnit().getName() : "Pieces")
                .unitShortCode(p.getUnit() != null ? p.getUnit().getShortCode() : "PCS")
                .purchasePrice(price)
                .sellingPrice(p.getSellingPrice())
                .currentStock(stock)
                .minimumStock(p.getMinimumStock())
                .reorderLevel(reorder)
                .isLowStock(reorder.compareTo(BigDecimal.ZERO) > 0 && stock.compareTo(reorder) <= 0)
                .stockValue(stock.multiply(price))
                .build();
    }

    private StockMovementResponse toMovementResponse(StockMovement m) {
        return StockMovementResponse.builder()
                .id(m.getId())
                .companyId(m.getCompany().getId())
                .productId(m.getProduct().getId())
                .productCode(m.getProduct().getProductCode())
                .productName(m.getProduct().getProductName())
                .movementType(m.getMovementType())
                .referenceType(m.getReferenceType())
                .referenceId(m.getReferenceId())
                .quantity(m.getQuantity())
                .unitCost(m.getUnitCost())
                .stockBefore(m.getStockBefore())
                .stockAfter(m.getStockAfter())
                .notes(m.getNotes())
                .createdByName(m.getCreatedBy() != null ? m.getCreatedBy().getFullName() : "System")
                .createdAt(m.getCreatedAt())
                .build();
    }
}

