package com.tradflow.accounting.sale.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.product.entity.Product;
import com.tradflow.accounting.product.repository.ProductRepository;
import com.tradflow.accounting.purchase.entity.Party;
import com.tradflow.accounting.purchase.repository.PartyRepository;
import com.tradflow.accounting.sale.dto.SaleDtos.*;
import com.tradflow.accounting.sale.entity.Sale;
import com.tradflow.accounting.sale.entity.SaleItem;
import com.tradflow.accounting.sale.repository.SaleItemRepository;
import com.tradflow.accounting.sale.repository.SaleRepository;
import com.tradflow.accounting.stock.service.StockService;
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
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CompanyRepository companyRepository;
    private final PartyRepository partyRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;

    @Transactional(readOnly = true)
    public Page<SaleResponse> getPage(
            UUID companyId,
            UUID customerId,
            String transactionType,
            String status,
            String search,
            Pageable pageable
    ) {
        Specification<Sale> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }

            if (transactionType != null && !transactionType.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("transactionType")), transactionType.trim().toUpperCase()));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numMatch = cb.like(cb.lower(root.get("invoiceNumber")), pattern);
                Predicate custMatch = cb.like(cb.lower(root.get("customer").get("partyName")), pattern);
                predicates.add(cb.or(numMatch, custMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return saleRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SaleResponse getById(UUID id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale invoice not found: " + id));
        return toResponse(sale);
    }

    @Transactional
    public SaleResponse create(SaleRequest request, User currentUser) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));

        if (saleRepository.existsByCompanyIdAndInvoiceNumberIgnoreCase(company.getId(), request.getInvoiceNumber())) {
            throw new DuplicateResourceException("Invoice number already exists: " + request.getInvoiceNumber());
        }

        Party customer = partyRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer party not found: " + request.getCustomerId()));

        boolean isGst = "GST".equalsIgnoreCase(request.getTransactionType());

        // Determine if Inter-State (IGST) or Intra-State (CGST + SGST) based on GSTIN state code
        boolean isInterState = false;
        if (isGst && customer.getGstin() != null && customer.getGstin().length() >= 2 && company.getGstin() != null && company.getGstin().length() >= 2) {
            String companyState = company.getGstin().substring(0, 2);
            String customerState = customer.getGstin().substring(0, 2);
            isInterState = !companyState.equalsIgnoreCase(customerState);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;
        BigDecimal totalIgst = BigDecimal.ZERO;

        List<SaleItem> items = new ArrayList<>();

        for (SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            BigDecimal qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ZERO;
            BigDecimal price = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal discPct = itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : BigDecimal.ZERO;

            BigDecimal lineGross = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineDisc = lineGross.multiply(discPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTaxable = lineGross.subtract(lineDisc).setScale(2, RoundingMode.HALF_UP);

            BigDecimal taxRate = BigDecimal.ZERO;
            BigDecimal cgst = BigDecimal.ZERO;
            BigDecimal sgst = BigDecimal.ZERO;
            BigDecimal igst = BigDecimal.ZERO;

            if (isGst) {
                taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() :
                        (product.getTaxRate() != null ? product.getTaxRate().getGstRate() : BigDecimal.ZERO);

                if (isInterState) {
                    igst = lineTaxable.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                } else {
                    BigDecimal halfRate = taxRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                    cgst = lineTaxable.multiply(halfRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    sgst = lineTaxable.multiply(halfRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }
            }

            BigDecimal lineTotal = lineTaxable.add(cgst).add(sgst).add(igst);

            subtotal = subtotal.add(lineGross);
            totalDiscount = totalDiscount.add(lineDisc);
            taxableAmount = taxableAmount.add(lineTaxable);
            totalCgst = totalCgst.add(cgst);
            totalSgst = totalSgst.add(sgst);
            totalIgst = totalIgst.add(igst);

            SaleItem item = SaleItem.builder()
                    .product(product)
                    .quantity(qty)
                    .unitPrice(price)
                    .discountPercent(discPct)
                    .discountAmount(lineDisc)
                    .taxableAmount(lineTaxable)
                    .taxRate(taxRate)
                    .cgstAmount(cgst)
                    .sgstAmount(sgst)
                    .igstAmount(igst)
                    .totalAmount(lineTotal)
                    .build();

            items.add(item);
        }

        BigDecimal otherCharges = request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO;
        BigDecimal roundOff = request.getRoundOff() != null ? request.getRoundOff() : BigDecimal.ZERO;
        BigDecimal grandTotal = taxableAmount.add(totalCgst).add(totalSgst).add(totalIgst).add(otherCharges).add(roundOff);
        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal outstandingAmount = grandTotal.subtract(paidAmount);

        Sale sale = Sale.builder()
                .company(company)
                .invoiceNumber(request.getInvoiceNumber().trim())
                .invoiceDate(request.getInvoiceDate())
                .customer(customer)
                .transactionType(isGst ? "GST" : "NON_GST")
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode().toUpperCase() : "CREDIT")
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
                .outstandingAmount(outstandingAmount)
                .status("CONFIRMED")
                .remarks(request.getRemarks())
                .createdBy(currentUser)
                .build();

        for (SaleItem item : items) {
            item.setSale(sale);
        }
        sale.setItems(items);

        Sale savedSale = saleRepository.save(sale);

        // Deduct stock for both GST and Non-GST sales
        for (SaleItem item : savedSale.getItems()) {
            stockService.recordMovement(
                    company,
                    item.getProduct(),
                    "OUT",
                    "SALE",
                    savedSale.getId(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    (isGst ? "GST" : "Non-GST") + " Sale Invoice #" + savedSale.getInvoiceNumber(),
                    currentUser
            );
        }

        log.info("Sale Invoice #{} created successfully. Deducted stock for {} items.",
                savedSale.getInvoiceNumber(), items.size());

        return toResponse(savedSale);
    }

    @Transactional
    public SaleResponse cancel(UUID id, User currentUser) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale invoice not found: " + id));

        if ("CANCELLED".equalsIgnoreCase(sale.getStatus())) {
            throw new IllegalStateException("Sale invoice is already cancelled");
        }

        sale.setStatus("CANCELLED");
        Sale saved = saleRepository.save(sale);

        // Restore stock for cancelled sales
        for (SaleItem item : saved.getItems()) {
            stockService.recordMovement(
                    saved.getCompany(),
                    item.getProduct(),
                    "IN",
                    "SALE",
                    saved.getId(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    "Reversal for Cancelled Sale #" + saved.getInvoiceNumber(),
                    currentUser
            );
        }

        log.info("Sale Invoice #{} cancelled. Restored stock for {} items.",
                saved.getInvoiceNumber(), saved.getItems().size());

        return toResponse(saved);
    }

    private SaleResponse toResponse(Sale s) {
        List<SaleItemResponse> itemResponses = s.getItems() != null ? s.getItems().stream().map(i -> {
            Product p = i.getProduct();
            return SaleItemResponse.builder()
                    .id(i.getId())
                    .productId(p != null ? p.getId() : null)
                    .productCode(p != null ? p.getProductCode() : null)
                    .productName(p != null ? p.getProductName() : null)
                    .hsnCode(p != null ? p.getHsnCode() : null)
                    .unitName(p != null && p.getUnit() != null ? p.getUnit().getName() : "Pieces")
                    .unitShortCode(p != null && p.getUnit() != null ? p.getUnit().getShortCode() : "PCS")
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .discountPercent(i.getDiscountPercent())
                    .discountAmount(i.getDiscountAmount())
                    .taxableAmount(i.getTaxableAmount())
                    .taxRate(i.getTaxRate())
                    .cgstAmount(i.getCgstAmount())
                    .sgstAmount(i.getSgstAmount())
                    .igstAmount(i.getIgstAmount())
                    .totalAmount(i.getTotalAmount())
                    .build();
        }).collect(Collectors.toList()) : new ArrayList<>();

        Party c = s.getCustomer();

        return SaleResponse.builder()
                .id(s.getId())
                .companyId(s.getCompany().getId())
                .companyName(s.getCompany().getCompanyName())
                .invoiceNumber(s.getInvoiceNumber())
                .invoiceDate(s.getInvoiceDate())
                .customerId(c != null ? c.getId() : null)
                .customerName(c != null ? c.getPartyName() : null)
                .customerGstin(c != null ? c.getGstin() : null)
                .customerPhone(c != null ? c.getPhone() : null)
                .customerAddress(c != null ? c.getAddress() : null)
                .transactionType(s.getTransactionType())
                .paymentMode(s.getPaymentMode())
                .subtotal(s.getSubtotal())
                .discountAmount(s.getDiscountAmount())
                .taxableAmount(s.getTaxableAmount())
                .cgstAmount(s.getCgstAmount())
                .sgstAmount(s.getSgstAmount())
                .igstAmount(s.getIgstAmount())
                .otherCharges(s.getOtherCharges())
                .roundOff(s.getRoundOff())
                .grandTotal(s.getGrandTotal())
                .paidAmount(s.getPaidAmount())
                .outstandingAmount(s.getOutstandingAmount())
                .status(s.getStatus())
                .remarks(s.getRemarks())
                .createdByName(s.getCreatedBy() != null ? s.getCreatedBy().getFullName() : null)
                .createdAt(s.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}

