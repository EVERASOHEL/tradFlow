package com.tradflow.accounting.purchase.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.purchase.dto.ImportDtos.*;
import com.tradflow.accounting.purchase.entity.ImportShipment;
import com.tradflow.accounting.purchase.entity.Party;
import com.tradflow.accounting.purchase.repository.ImportRepository;
import com.tradflow.accounting.purchase.repository.PartyRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImportService {

    private final ImportRepository importRepository;
    private final CompanyRepository companyRepository;
    private final PartyRepository partyRepository;

    @Transactional(readOnly = true)
    public Page<ImportResponse> getPage(UUID companyId, String search, String status, Pageable pageable) {
        Specification<ImportShipment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numMatch = cb.like(cb.lower(root.get("importNumber")), pattern);
                Predicate remarksMatch = cb.like(cb.lower(root.get("remarks")), pattern);
                Predicate supplierMatch = cb.like(cb.lower(root.get("supplier").get("partyName")), pattern);
                predicates.add(cb.or(numMatch, remarksMatch, supplierMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return importRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ImportResponse getById(UUID id) {
        return toResponse(importRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Import shipment not found: " + id)));
    }

    @Transactional
    public ImportResponse create(ImportCreateRequest request, User currentUser) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));

        if (importRepository.existsByCompanyIdAndImportNumberIgnoreCase(company.getId(), request.getImportNumber())) {
            throw new DuplicateResourceException("Import number already exists for company: " + request.getImportNumber());
        }

        Party supplier = null;
        if (request.getSupplierId() != null) {
            supplier = partyRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + request.getSupplierId()));
        }

        // Automatic financial calculations
        BigDecimal totalRmb = request.getTotalRmb() != null ? request.getTotalRmb() : request.getRmbPrice();
        BigDecimal exchangeRate = request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ZERO;

        BigDecimal totalPurchaseValue = request.getTotalPurchaseValue();
        if ((totalPurchaseValue == null || totalPurchaseValue.compareTo(BigDecimal.ZERO) == 0)
                && totalRmb != null && exchangeRate.compareTo(BigDecimal.ZERO) > 0) {
            totalPurchaseValue = totalRmb.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
        }
        if (totalPurchaseValue == null) totalPurchaseValue = BigDecimal.ZERO;

        BigDecimal agentCharges = request.getAgentCharges();
        String agentFeeBasis = request.getAgentFeeBasis() != null ? request.getAgentFeeBasis() : "PER_RMB";
        BigDecimal agentRate = request.getAgentRate();
        if (agentRate == null && request.getAgentRatePerRmb() != null) {
            agentRate = request.getAgentRatePerRmb();
        }

        if ((agentCharges == null || agentCharges.compareTo(BigDecimal.ZERO) == 0) && agentRate != null) {
            if ("PER_RMB".equalsIgnoreCase(agentFeeBasis) && totalRmb != null) {
                agentCharges = totalRmb.multiply(agentRate).setScale(2, RoundingMode.HALF_UP);
            }
        }
        if (agentCharges == null) agentCharges = BigDecimal.ZERO;

        BigDecimal advancePercentage = request.getAdvancePercentage() != null ? request.getAdvancePercentage() : new BigDecimal("30.00");
        BigDecimal advanceAmount = request.getAdvanceAmount();
        if ((advanceAmount == null || advanceAmount.compareTo(BigDecimal.ZERO) == 0) && totalPurchaseValue.compareTo(BigDecimal.ZERO) > 0) {
            advanceAmount = totalPurchaseValue.multiply(advancePercentage).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }
        if (advanceAmount == null) advanceAmount = BigDecimal.ZERO;

        BigDecimal transport = request.getTransportationExpense() != null ? request.getTransportationExpense() : BigDecimal.ZERO;
        BigDecimal importExpense = request.getTotalImportExpense() != null ? request.getTotalImportExpense() : BigDecimal.ZERO;

        BigDecimal landedCost = request.getLandedCost();
        if (landedCost == null || landedCost.compareTo(BigDecimal.ZERO) == 0) {
            landedCost = totalPurchaseValue.add(agentCharges).add(transport).add(importExpense);
        }

        ImportShipment shipment = ImportShipment.builder()
                .company(company)
                .importNumber(request.getImportNumber().trim().toUpperCase())
                .supplier(supplier)
                .orderDate(request.getOrderDate())
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "CNY")
                .rmbPrice(request.getRmbPrice())
                .exchangeRate(exchangeRate)
                .totalRmb(totalRmb)
                .totalPurchaseValue(totalPurchaseValue)
                .agentFeeBasis(agentFeeBasis)
                .agentRate(agentRate)
                .agentRatePerRmb(request.getAgentRatePerRmb() != null ? request.getAgentRatePerRmb() : ("PER_RMB".equalsIgnoreCase(agentFeeBasis) ? agentRate : null))
                .agentRatePerKg(request.getAgentRatePerKg() != null ? request.getAgentRatePerKg() : ("PER_KG".equalsIgnoreCase(agentFeeBasis) ? agentRate : null))
                .agentRatePerCbm(request.getAgentRatePerCbm() != null ? request.getAgentRatePerCbm() : ("PER_CBM".equalsIgnoreCase(agentFeeBasis) ? agentRate : null))
                .agentCharges(agentCharges)
                .totalBoxes(request.getTotalBoxes() != null ? request.getTotalBoxes() : 0)
                .silverRate(request.getSilverRate())
                .copperRate(request.getCopperRate())
                .advancePercentage(advancePercentage)
                .advanceAmount(advanceAmount)
                .productionReadyDate(request.getProductionReadyDate())
                .packingListDate(request.getPackingListDate())
                .goodsLoadingDate(request.getGoodsLoadingDate())
                .portArrivalDate(request.getPortArrivalDate())
                .warehouseArrivalDate(request.getWarehouseArrivalDate())
                .customsStatus(request.getCustomsStatus())
                .holdReason(request.getHoldReason())
                .transportationExpense(transport)
                .totalImportExpense(importExpense)
                .landedCost(landedCost)
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ORDERED")
                .remarks(request.getRemarks())
                .createdBy(currentUser)
                .build();

        return toResponse(importRepository.save(shipment));
    }

    @Transactional
    public ImportResponse updateStage(UUID id, ImportStageUpdateRequest request) {
        ImportShipment shipment = importRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Import shipment not found: " + id));

        if (request.getOrderDate() != null) shipment.setOrderDate(request.getOrderDate());
        if (request.getRmbPrice() != null) shipment.setRmbPrice(request.getRmbPrice());
        if (request.getExchangeRate() != null) shipment.setExchangeRate(request.getExchangeRate());
        if (request.getTotalRmb() != null) shipment.setTotalRmb(request.getTotalRmb());

        if (request.getTotalPurchaseValue() != null) {
            shipment.setTotalPurchaseValue(request.getTotalPurchaseValue());
        } else if (shipment.getTotalRmb() != null && shipment.getExchangeRate() != null && shipment.getExchangeRate().compareTo(BigDecimal.ZERO) > 0) {
            shipment.setTotalPurchaseValue(shipment.getTotalRmb().multiply(shipment.getExchangeRate()).setScale(2, RoundingMode.HALF_UP));
        }

        if (request.getAgentFeeBasis() != null) shipment.setAgentFeeBasis(request.getAgentFeeBasis());
        if (request.getAgentRate() != null) shipment.setAgentRate(request.getAgentRate());
        if (request.getAgentRatePerRmb() != null) shipment.setAgentRatePerRmb(request.getAgentRatePerRmb());
        if (request.getAgentRatePerKg() != null) shipment.setAgentRatePerKg(request.getAgentRatePerKg());
        if (request.getAgentRatePerCbm() != null) shipment.setAgentRatePerCbm(request.getAgentRatePerCbm());
        if (request.getTotalBoxes() != null) shipment.setTotalBoxes(request.getTotalBoxes());

        if (request.getAgentCharges() != null) {
            shipment.setAgentCharges(request.getAgentCharges());
        } else if (shipment.getAgentRate() != null) {
            String basis = shipment.getAgentFeeBasis() != null ? shipment.getAgentFeeBasis() : "PER_RMB";
            if ("PER_RMB".equalsIgnoreCase(basis) && shipment.getTotalRmb() != null) {
                shipment.setAgentCharges(shipment.getTotalRmb().multiply(shipment.getAgentRate()).setScale(2, RoundingMode.HALF_UP));
            }
        } else if (shipment.getTotalRmb() != null && shipment.getAgentRatePerRmb() != null) {
            shipment.setAgentCharges(shipment.getTotalRmb().multiply(shipment.getAgentRatePerRmb()).setScale(2, RoundingMode.HALF_UP));
        }

        if (request.getSilverRate() != null) shipment.setSilverRate(request.getSilverRate());
        if (request.getCopperRate() != null) shipment.setCopperRate(request.getCopperRate());
        if (request.getAdvancePercentage() != null) shipment.setAdvancePercentage(request.getAdvancePercentage());
        if (request.getAdvanceAmount() != null) shipment.setAdvanceAmount(request.getAdvanceAmount());

        if (request.getProductionReadyDate() != null) shipment.setProductionReadyDate(request.getProductionReadyDate());
        if (request.getPackingListDate() != null) shipment.setPackingListDate(request.getPackingListDate());
        if (request.getGoodsLoadingDate() != null) shipment.setGoodsLoadingDate(request.getGoodsLoadingDate());
        if (request.getPortArrivalDate() != null) shipment.setPortArrivalDate(request.getPortArrivalDate());
        if (request.getWarehouseArrivalDate() != null) shipment.setWarehouseArrivalDate(request.getWarehouseArrivalDate());

        if (request.getCustomsStatus() != null) shipment.setCustomsStatus(request.getCustomsStatus());
        if (request.getHoldReason() != null) shipment.setHoldReason(request.getHoldReason());
        if (request.getTransportationExpense() != null) shipment.setTransportationExpense(request.getTransportationExpense());
        if (request.getTotalImportExpense() != null) shipment.setTotalImportExpense(request.getTotalImportExpense());

        // Recompute Landed Cost
        BigDecimal totalPurchase = shipment.getTotalPurchaseValue() != null ? shipment.getTotalPurchaseValue() : BigDecimal.ZERO;
        BigDecimal agent = shipment.getAgentCharges() != null ? shipment.getAgentCharges() : BigDecimal.ZERO;
        BigDecimal transport = shipment.getTransportationExpense() != null ? shipment.getTransportationExpense() : BigDecimal.ZERO;
        BigDecimal expense = shipment.getTotalImportExpense() != null ? shipment.getTotalImportExpense() : BigDecimal.ZERO;

        if (request.getLandedCost() != null) {
            shipment.setLandedCost(request.getLandedCost());
        } else {
            shipment.setLandedCost(totalPurchase.add(agent).add(transport).add(expense));
        }

        if (request.getStatus() != null) shipment.setStatus(request.getStatus().toUpperCase());
        if (request.getRemarks() != null) shipment.setRemarks(request.getRemarks());

        return toResponse(importRepository.save(shipment));
    }

    @Transactional
    public void delete(UUID id) {
        ImportShipment shipment = importRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Import shipment not found: " + id));
        importRepository.delete(shipment);
    }

    public ImportResponse toResponse(ImportShipment s) {
        return ImportResponse.builder()
                .id(s.getId())
                .companyId(s.getCompany() != null ? s.getCompany().getId() : null)
                .companyName(s.getCompany() != null ? s.getCompany().getCompanyName() : null)
                .importNumber(s.getImportNumber())
                .supplierId(s.getSupplier() != null ? s.getSupplier().getId() : null)
                .supplierName(s.getSupplier() != null ? s.getSupplier().getPartyName() : null)
                .supplierCountry(s.getSupplier() != null ? s.getSupplier().getCountry() : null)
                .orderDate(s.getOrderDate())
                .currencyCode(s.getCurrencyCode())
                .rmbPrice(s.getRmbPrice())
                .exchangeRate(s.getExchangeRate())
                .totalRmb(s.getTotalRmb())
                .totalPurchaseValue(s.getTotalPurchaseValue())
                .agentFeeBasis(s.getAgentFeeBasis())
                .agentRate(s.getAgentRate())
                .agentRatePerRmb(s.getAgentRatePerRmb())
                .agentRatePerKg(s.getAgentRatePerKg())
                .agentRatePerCbm(s.getAgentRatePerCbm())
                .agentCharges(s.getAgentCharges())
                .totalBoxes(s.getTotalBoxes())
                .silverRate(s.getSilverRate())
                .copperRate(s.getCopperRate())
                .advancePercentage(s.getAdvancePercentage())
                .advanceAmount(s.getAdvanceAmount())
                .productionReadyDate(s.getProductionReadyDate())
                .packingListDate(s.getPackingListDate())
                .goodsLoadingDate(s.getGoodsLoadingDate())
                .portArrivalDate(s.getPortArrivalDate())
                .warehouseArrivalDate(s.getWarehouseArrivalDate())
                .customsStatus(s.getCustomsStatus())
                .holdReason(s.getHoldReason())
                .transportationExpense(s.getTransportationExpense())
                .totalImportExpense(s.getTotalImportExpense())
                .landedCost(s.getLandedCost())
                .status(s.getStatus())
                .remarks(s.getRemarks())
                .createdById(s.getCreatedBy() != null ? s.getCreatedBy().getId() : null)
                .createdByName(s.getCreatedBy() != null ? s.getCreatedBy().getFullName() : null)
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null)
                .build();
    }
}

