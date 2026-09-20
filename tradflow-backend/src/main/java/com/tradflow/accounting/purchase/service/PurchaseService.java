package com.tradflow.accounting.purchase.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.product.entity.Product;
import com.tradflow.accounting.product.repository.ProductRepository;
import com.tradflow.accounting.purchase.dto.PurchaseDtos.*;
import com.tradflow.accounting.purchase.entity.ImportShipment;
import com.tradflow.accounting.purchase.entity.Party;
import com.tradflow.accounting.purchase.entity.Purchase;
import com.tradflow.accounting.purchase.entity.PurchaseItem;
import com.tradflow.accounting.purchase.repository.ImportRepository;
import com.tradflow.accounting.purchase.repository.PartyRepository;
import com.tradflow.accounting.purchase.repository.PurchaseItemRepository;
import com.tradflow.accounting.purchase.repository.PurchaseRepository;
import com.tradflow.accounting.stock.service.StockService;
import com.tradflow.accounting.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final CompanyRepository companyRepository;
    private final PartyRepository partyRepository;
    private final ImportRepository importRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;

    @Transactional(readOnly = true)
    public Page<PurchaseResponse> getPage(
            UUID companyId,
            UUID supplierId,
            String transactionType,
            String status,
            String search,
            Pageable pageable
    ) {
        Specification<Purchase> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }

            if (transactionType != null && !transactionType.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("transactionType")), transactionType.trim().toUpperCase()));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numMatch = cb.like(cb.lower(root.get("purchaseNumber")), pattern);
                Predicate invMatch = cb.like(cb.lower(root.get("supplierInvoiceNumber")), pattern);
                Predicate supMatch = cb.like(cb.lower(root.get("supplier").get("partyName")), pattern);
                predicates.add(cb.or(numMatch, invMatch, supMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return purchaseRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PurchaseResponse getById(UUID id) {
        return toResponse(purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found: " + id)));
    }

    @Transactional
    public PurchaseResponse create(PurchaseRequest request, User currentUser) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));

        if (purchaseRepository.existsByCompanyIdAndPurchaseNumberIgnoreCase(company.getId(), request.getPurchaseNumber())) {
            throw new DuplicateResourceException("Purchase number already exists: " + request.getPurchaseNumber());
        }

        Party supplier = partyRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + request.getSupplierId()));

        ImportShipment importShipment = null;
        if (request.getImportId() != null) {
            importShipment = importRepository.findById(request.getImportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Linked import shipment not found: " + request.getImportId()));
        }

        boolean isGst = "GST".equalsIgnoreCase(request.getTransactionType());
        boolean isChina = "China".equalsIgnoreCase(supplier.getCountry());
        String currency = request.getCurrencyCode() != null ? request.getCurrencyCode() : (isChina ? "CNY" : "INR");

        // Process line items and compute headers
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;

        BigDecimal totalBoxesSum = BigDecimal.ZERO;
        BigDecimal totalCbmSum = BigDecimal.ZERO;
        BigDecimal totalWeightKgSum = BigDecimal.ZERO;

        List<PurchaseItem> items = new ArrayList<>();

        for (PurchaseItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            String packagingType = "PIECE";
            Integer piecesPerBox = itemReq.getPiecesPerBox();
            if (piecesPerBox == null && product.getPiecesPerBox() != null) {
                piecesPerBox = product.getPiecesPerBox();
            }

            BigDecimal qty = itemReq.getQuantity();
            BigDecimal totalPieces = qty;
            BigDecimal boxCount = BigDecimal.ZERO;

            if (piecesPerBox != null && piecesPerBox > 0) {
                boxCount = totalPieces.divide(new BigDecimal(piecesPerBox), 2, RoundingMode.HALF_UP);
            } else if (itemReq.getBoxCount() != null) {
                boxCount = itemReq.getBoxCount();
            }

            BigDecimal rate = itemReq.getRate();
            BigDecimal lineGross = qty.multiply(rate).setScale(2, RoundingMode.HALF_UP);

            BigDecimal discPercent = itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : BigDecimal.ZERO;
            BigDecimal discAmount = itemReq.getDiscountAmount();
            if ((discAmount == null || discAmount.compareTo(BigDecimal.ZERO) == 0) && discPercent.compareTo(BigDecimal.ZERO) > 0) {
                discAmount = lineGross.multiply(discPercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            }
            if (discAmount == null) discAmount = BigDecimal.ZERO;

            BigDecimal lineTaxable = lineGross.subtract(discAmount);
            if (lineTaxable.compareTo(BigDecimal.ZERO) < 0) lineTaxable = BigDecimal.ZERO;

            BigDecimal taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() : BigDecimal.ZERO;
            BigDecimal cgst = BigDecimal.ZERO;
            BigDecimal sgst = BigDecimal.ZERO;
            BigDecimal igst = BigDecimal.ZERO;

            if (isGst && taxRate.compareTo(BigDecimal.ZERO) > 0) {
                boolean isInterstateOrImport = isChina
                        || supplier.getGstin() == null
                        || (itemReq.getIgstAmount() != null && itemReq.getIgstAmount().compareTo(BigDecimal.ZERO) > 0);

                if (isInterstateOrImport) {
                    igst = lineTaxable.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                } else {
                    BigDecimal halfRate = taxRate.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
                    cgst = lineTaxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                    sgst = lineTaxable.multiply(halfRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                }
            }

            BigDecimal lineTotal = lineTaxable.add(cgst).add(sgst).add(igst);

            BigDecimal length = itemReq.getLength() != null ? itemReq.getLength() : product.getBoxLength();
            BigDecimal width = itemReq.getWidth() != null ? itemReq.getWidth() : product.getBoxWidth();
            BigDecimal height = itemReq.getHeight() != null ? itemReq.getHeight() : product.getBoxHeight();
            String dimUnit = itemReq.getDimensionUnit() != null ? itemReq.getDimensionUnit() : product.getDimensionUnit();
            if (dimUnit == null) dimUnit = "cm";

            BigDecimal netWeight = itemReq.getNetWeight() != null ? itemReq.getNetWeight() : product.getNetWeight();
            BigDecimal grossWeight = itemReq.getGrossWeight() != null ? itemReq.getGrossWeight() : product.getGrossWeight();
            String weightUnit = itemReq.getWeightUnit() != null ? itemReq.getWeightUnit() : product.getWeightUnit();
            if (weightUnit == null) weightUnit = "kg";

            BigDecimal totalCbm = itemReq.getTotalCbm();
            if ((totalCbm == null || totalCbm.compareTo(BigDecimal.ZERO) == 0) && length != null && width != null && height != null) {
                BigDecimal effectiveBoxes = (boxCount != null && boxCount.compareTo(BigDecimal.ZERO) > 0) ? boxCount : BigDecimal.ONE;
                totalCbm = length.multiply(width).multiply(height)
                        .divide(new BigDecimal("1000000"), 4, RoundingMode.HALF_UP)
                        .multiply(effectiveBoxes);
            }
            if (totalCbm == null) totalCbm = BigDecimal.ZERO;

            BigDecimal totalWeightKg = itemReq.getTotalWeightKg();
            if (totalWeightKg == null || totalWeightKg.compareTo(BigDecimal.ZERO) == 0) {
                BigDecimal perBoxWt = grossWeight != null ? grossWeight : netWeight;
                if (perBoxWt != null) {
                    BigDecimal effectiveBoxes = (boxCount != null && boxCount.compareTo(BigDecimal.ZERO) > 0) ? boxCount : BigDecimal.ONE;
                    totalWeightKg = perBoxWt.multiply(effectiveBoxes).setScale(2, RoundingMode.HALF_UP);
                }
            }
            if (totalWeightKg == null) totalWeightKg = BigDecimal.ZERO;

            subtotal = subtotal.add(lineGross);
            totalDiscount = totalDiscount.add(discAmount);
            taxableAmount = taxableAmount.add(lineTaxable);
            totalCgst = totalCgst.add(cgst);
            totalSgst = totalSgst.add(sgst);
            totalIgst = totalIgst.add(igst);

            if (boxCount != null) totalBoxesSum = totalBoxesSum.add(boxCount);
            totalCbmSum = totalCbmSum.add(totalCbm);
            totalWeightKgSum = totalWeightKgSum.add(totalWeightKg);

            PurchaseItem item = PurchaseItem.builder()
                    .product(product)
                    .quantity(qty)
                    .rate(rate)
                    .discountPercent(discPercent)
                    .discountAmount(discAmount)
                    .taxRate(taxRate)
                    .cgstAmount(cgst)
                    .sgstAmount(sgst)
                    .igstAmount(igst)
                    .taxableAmount(lineTaxable)
                    .totalAmount(lineTotal)
                    .packagingType(packagingType)
                    .piecesPerBox(piecesPerBox)
                    .boxCount(boxCount)
                    .totalPieces(totalPieces)
                    .length(length)
                    .width(width)
                    .height(height)
                    .dimensionUnit(dimUnit)
                    .netWeight(netWeight)
                    .grossWeight(grossWeight)
                    .weightUnit(weightUnit)
                    .totalCbm(totalCbm)
                    .totalWeightKg(totalWeightKg)
                    .unitLandedCost(itemReq.getUnitLandedCost())
                    .build();

            items.add(item);
        }

        Integer totalBoxes = request.getTotalBoxes() != null ? request.getTotalBoxes() : totalBoxesSum.setScale(0, RoundingMode.CEILING).intValue();
        BigDecimal totalCbm = request.getTotalCbm() != null ? request.getTotalCbm() : totalCbmSum.setScale(4, RoundingMode.HALF_UP);
        BigDecimal totalWeightKg = request.getTotalWeightKg() != null ? request.getTotalWeightKg() : totalWeightKgSum.setScale(2, RoundingMode.HALF_UP);

        BigDecimal exchangeRate = request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE;
        BigDecimal totalRmb = request.getTotalRmb() != null ? request.getTotalRmb() : request.getRmbPrice();
        if (totalRmb == null && "CNY".equalsIgnoreCase(currency)) {
            totalRmb = taxableAmount;
        }

        // Single-select agent fee basis calculation
        String agentFeeBasis = request.getAgentFeeBasis() != null ? request.getAgentFeeBasis() : "PER_RMB";
        BigDecimal agentRate = request.getAgentRate();
        BigDecimal calculatedAgentCharges = BigDecimal.ZERO;
        if (agentRate != null && agentRate.compareTo(BigDecimal.ZERO) > 0) {
            switch (agentFeeBasis.toUpperCase()) {
                case "PER_RMB":
                    if (totalRmb != null) {
                        calculatedAgentCharges = totalRmb.multiply(agentRate).setScale(2, RoundingMode.HALF_UP);
                    }
                    break;
                case "PER_KG":
                    if (totalWeightKg != null) {
                        calculatedAgentCharges = totalWeightKg.multiply(agentRate).setScale(2, RoundingMode.HALF_UP);
                    }
                    break;
                case "PER_CBM":
                    if (totalCbm != null) {
                        calculatedAgentCharges = totalCbm.multiply(agentRate).setScale(2, RoundingMode.HALF_UP);
                    }
                    break;
                case "FIXED":
                    calculatedAgentCharges = agentRate;
                    break;
            }
        }

        BigDecimal otherCharges = request.getOtherCharges() != null ? request.getOtherCharges() : calculatedAgentCharges;
        BigDecimal roundOff = request.getRoundOff() != null ? request.getRoundOff() : BigDecimal.ZERO;

        // When currency is CNY, goods purchase cost in INR is taxableAmount * exchangeRate
        BigDecimal totalPurchaseCostInr = "CNY".equalsIgnoreCase(currency)
                ? taxableAmount.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP)
                : taxableAmount;

        // Grand Total is the total landed purchase cost in INR
        BigDecimal grandTotal = request.getGrandTotal() != null
                ? request.getGrandTotal()
                : totalPurchaseCostInr.add(totalCgst).add(totalSgst).add(totalIgst).add(otherCharges).add(roundOff);

        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal outstanding = grandTotal.subtract(paidAmount);
        if (outstanding.compareTo(BigDecimal.ZERO) < 0) outstanding = BigDecimal.ZERO;

        for (PurchaseItem item : items) {
            if (item.getUnitLandedCost() == null || item.getUnitLandedCost().compareTo(BigDecimal.ZERO) == 0) {
                BigDecimal pieces = item.getTotalPieces() != null && item.getTotalPieces().compareTo(BigDecimal.ZERO) > 0
                        ? item.getTotalPieces() : item.getQuantity();
                BigDecimal lineCostInr = "CNY".equalsIgnoreCase(currency)
                        ? item.getTaxableAmount().multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP)
                        : item.getTaxableAmount();

                BigDecimal allocatedExpenseInr = BigDecimal.ZERO;
                if (totalPurchaseCostInr.compareTo(BigDecimal.ZERO) > 0 && otherCharges.compareTo(BigDecimal.ZERO) > 0) {
                    allocatedExpenseInr = otherCharges.multiply(lineCostInr).divide(totalPurchaseCostInr, 2, RoundingMode.HALF_UP);
                }
                BigDecimal totalLineCostInr = lineCostInr.add(allocatedExpenseInr);
                BigDecimal perPieceLandedInr = pieces.compareTo(BigDecimal.ZERO) > 0
                        ? totalLineCostInr.divide(pieces, 2, RoundingMode.HALF_UP)
                        : lineCostInr;
                item.setUnitLandedCost(perPieceLandedInr);
            }
        }

        Purchase purchase = Purchase.builder()
                .company(company)
                .purchaseNumber(request.getPurchaseNumber().trim().toUpperCase())
                .purchaseDate(request.getPurchaseDate())
                .supplier(supplier)
                .supplierInvoiceNumber(request.getSupplierInvoiceNumber())
                .supplierInvoiceDate(request.getSupplierInvoiceDate())
                .transactionType(request.getTransactionType().toUpperCase())
                .currencyCode(currency)
                .rmbPrice(request.getRmbPrice())
                .exchangeRate(exchangeRate)
                .totalRmb(totalRmb)
                .agentFeeBasis(agentFeeBasis)
                .agentRate(agentRate)
                .totalBoxes(totalBoxes)
                .totalCbm(totalCbm)
                .totalWeightKg(totalWeightKg)
                .subtotal(subtotal)
                .discountAmount(totalDiscount)
                .taxableAmount(taxableAmount)
                .cgstAmount(totalCgst)
                .sgstAmount(totalSgst)
                .igstAmount(totalIgst)
                .otherCharges(otherCharges)
                .roundOff(roundOff)
                .grandTotal(grandTotal)
                .paidAmount(paidAmount)
                .outstandingAmount(outstanding)
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "CONFIRMED")
                .importShipment(importShipment)
                .remarks(request.getRemarks())
                .createdBy(currentUser)
                .build();

        // Assign purchase to items
        for (PurchaseItem item : items) {
            item.setPurchase(purchase);
        }
        purchase.setItems(items);

        // Sync with linked Import Shipment
        if (importShipment != null) {
            if (importShipment.getTotalBoxes() == null || importShipment.getTotalBoxes() == 0) {
                importShipment.setTotalBoxes(totalBoxes);
            }
            if (totalRmb != null && (importShipment.getTotalRmb() == null || importShipment.getTotalRmb().compareTo(BigDecimal.ZERO) == 0)) {
                importShipment.setTotalRmb(totalRmb);
            }
            if (importShipment.getAgentFeeBasis() == null) {
                importShipment.setAgentFeeBasis(agentFeeBasis);
            }
            if (importShipment.getAgentRate() == null && agentRate != null) {
                importShipment.setAgentRate(agentRate);
            }
            if (calculatedAgentCharges.compareTo(BigDecimal.ZERO) > 0 && (importShipment.getAgentCharges() == null || importShipment.getAgentCharges().compareTo(BigDecimal.ZERO) == 0)) {
                importShipment.setAgentCharges(calculatedAgentCharges);
            }
            if (importShipment.getTotalPurchaseValue() == null || importShipment.getTotalPurchaseValue().compareTo(BigDecimal.ZERO) == 0) {
                importShipment.setTotalPurchaseValue(grandTotal);
            }
            importRepository.save(importShipment);
        }

        Purchase saved = purchaseRepository.save(purchase);
        stockService.addStockForPurchase(saved, saved.getItems(), currentUser);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        delete(id, null);
    }

    @Transactional
    public void delete(UUID id, User currentUser) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found: " + id));
        stockService.reverseStockForPurchase(purchase, currentUser);
        purchaseRepository.delete(purchase);
    }

    @Transactional(readOnly = true)
    public List<SupplierPurchaseSummary> getSupplierSummaries(UUID companyId) {
        List<Party> suppliers = partyRepository.findAccessibleByCompanyAndType(companyId, "SUPPLIER");
        List<Purchase> allPurchases = purchaseRepository.findByCompanyIdOrderByPurchaseDateDesc(companyId);

        Map<UUID, List<Purchase>> bySupplier = allPurchases.stream()
                .filter(p -> p.getSupplier() != null)
                .collect(Collectors.groupingBy(p -> p.getSupplier().getId()));

        List<SupplierPurchaseSummary> summaries = new ArrayList<>();

        for (Party supplier : suppliers) {
            List<Purchase> list = bySupplier.getOrDefault(supplier.getId(), List.of());
            int totalInvoices = list.size();
            BigDecimal totalInr = list.stream()
                    .map(p -> p.getGrandTotal() != null ? p.getGrandTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalRmb = list.stream()
                    .map(p -> p.getTotalRmb() != null ? p.getTotalRmb() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPaid = list.stream()
                    .map(p -> p.getPaidAmount() != null ? p.getPaidAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal outstanding = list.stream()
                    .map(p -> p.getOutstandingAmount() != null ? p.getOutstandingAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            int totalBoxes = list.stream()
                    .mapToInt(p -> p.getTotalBoxes() != null ? p.getTotalBoxes() : 0)
                    .sum();
            BigDecimal totalCbm = list.stream()
                    .map(p -> p.getTotalCbm() != null ? p.getTotalCbm() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            LocalDate lastDate = list.isEmpty() ? null : list.get(0).getPurchaseDate();

            summaries.add(SupplierPurchaseSummary.builder()
                    .supplierId(supplier.getId())
                    .supplierName(supplier.getPartyName())
                    .tradeName(supplier.getPartyName())
                    .contactPerson(supplier.getContactPerson())
                    .phone(supplier.getPhone())
                    .email(supplier.getEmail())
                    .country(supplier.getCountry())
                    .currencyCode(supplier.getCurrencyCode())
                    .gstin(supplier.getGstin())
                    .totalInvoices(totalInvoices)
                    .totalPurchasedInr(totalInr)
                    .totalPurchasedRmb(totalRmb)
                    .totalPaidInr(totalPaid)
                    .outstandingDueInr(outstanding)
                    .totalBoxes(totalBoxes)
                    .totalCbm(totalCbm)
                    .lastPurchaseDate(lastDate)
                    .build());
        }

        return summaries;
    }

    public PurchaseResponse toResponse(Purchase p) {
        List<PurchaseItemResponse> itemResponses = p.getItems() != null
                ? p.getItems().stream().map(this::toItemResponse).collect(Collectors.toList())
                : List.of();

        return PurchaseResponse.builder()
                .id(p.getId())
                .companyId(p.getCompany() != null ? p.getCompany().getId() : null)
                .companyName(p.getCompany() != null ? p.getCompany().getCompanyName() : null)
                .purchaseNumber(p.getPurchaseNumber())
                .purchaseDate(p.getPurchaseDate())
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getPartyName() : null)
                .supplierCountry(p.getSupplier() != null ? p.getSupplier().getCountry() : null)
                .supplierInvoiceNumber(p.getSupplierInvoiceNumber())
                .supplierInvoiceDate(p.getSupplierInvoiceDate())
                .transactionType(p.getTransactionType())
                .currencyCode(p.getCurrencyCode())
                .rmbPrice(p.getRmbPrice())
                .exchangeRate(p.getExchangeRate())
                .totalRmb(p.getTotalRmb())
                .agentFeeBasis(p.getAgentFeeBasis())
                .agentRate(p.getAgentRate())
                .totalBoxes(p.getTotalBoxes())
                .totalCbm(p.getTotalCbm())
                .totalWeightKg(p.getTotalWeightKg())
                .subtotal(p.getSubtotal())
                .discountAmount(p.getDiscountAmount())
                .taxableAmount(p.getTaxableAmount())
                .cgstAmount(p.getCgstAmount())
                .sgstAmount(p.getSgstAmount())
                .igstAmount(p.getIgstAmount())
                .otherCharges(p.getOtherCharges())
                .roundOff(p.getRoundOff())
                .grandTotal(p.getGrandTotal())
                .paidAmount(p.getPaidAmount())
                .outstandingAmount(p.getOutstandingAmount())
                .status(p.getStatus())
                .importId(p.getImportShipment() != null ? p.getImportShipment().getId() : null)
                .importNumber(p.getImportShipment() != null ? p.getImportShipment().getImportNumber() : null)
                .remarks(p.getRemarks())
                .createdById(p.getCreatedBy() != null ? p.getCreatedBy().getId() : null)
                .createdByName(p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null)
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .items(itemResponses)
                .build();
    }

    public PurchaseItemResponse toItemResponse(PurchaseItem i) {
        return PurchaseItemResponse.builder()
                .id(i.getId())
                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                .productCode(i.getProduct() != null ? i.getProduct().getProductCode() : null)
                .productName(i.getProduct() != null ? i.getProduct().getProductName() : null)
                .quantity(i.getQuantity())
                .rate(i.getRate())
                .discountPercent(i.getDiscountPercent())
                .discountAmount(i.getDiscountAmount())
                .taxRate(i.getTaxRate())
                .cgstAmount(i.getCgstAmount())
                .sgstAmount(i.getSgstAmount())
                .igstAmount(i.getIgstAmount())
                .taxableAmount(i.getTaxableAmount())
                .totalAmount(i.getTotalAmount())
                .packagingType(i.getPackagingType())
                .piecesPerBox(i.getPiecesPerBox())
                .boxCount(i.getBoxCount())
                .totalPieces(i.getTotalPieces())
                .length(i.getLength())
                .width(i.getWidth())
                .height(i.getHeight())
                .dimensionUnit(i.getDimensionUnit())
                .netWeight(i.getNetWeight())
                .grossWeight(i.getGrossWeight())
                .weightUnit(i.getWeightUnit())
                .totalCbm(i.getTotalCbm())
                .totalWeightKg(i.getTotalWeightKg())
                .unitLandedCost(i.getUnitLandedCost())
                .build();
    }
}

