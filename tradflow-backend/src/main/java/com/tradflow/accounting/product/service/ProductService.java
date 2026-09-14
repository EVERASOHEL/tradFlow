package com.tradflow.accounting.product.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.product.dto.ProductRequest;
import com.tradflow.accounting.product.dto.ProductResponse;
import com.tradflow.accounting.product.entity.*;
import com.tradflow.accounting.product.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductSubcategoryRepository subcategoryRepository;
    private final UnitRepository unitRepository;
    private final TaxRateRepository taxRateRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getPage(
            String search,
            UUID categoryId,
            UUID companyId,
            Boolean isGlobalOnly,
            Pageable pageable
    ) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Active only
            predicates.add(cb.isTrue(root.get("active")));

            // Company Scoping
            if (Boolean.TRUE.equals(isGlobalOnly)) {
                predicates.add(cb.isNull(root.get("company")));
            } else if (companyId != null) {
                // Accessible by company = either belongs to this company or is a global master
                predicates.add(cb.or(
                        cb.equal(root.get("company").get("id"), companyId),
                        cb.isNull(root.get("company"))
                ));
            }

            // Category Filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Search Keyword
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("productCode")), pattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("productName")), pattern);
                Predicate brandMatch = cb.like(cb.lower(root.get("brand")), pattern);
                Predicate hsnMatch = cb.like(cb.lower(root.get("hsnCode")), pattern);
                predicates.add(cb.or(codeMatch, nameMatch, brandMatch, hsnMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toResponse(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        // Uniqueness check
        if (request.getCompanyId() != null) {
            if (productRepository.existsByCompanyIdAndProductCodeIgnoreCase(request.getCompanyId(), request.getProductCode())) {
                throw new DuplicateResourceException("Product code already exists for company: " + request.getProductCode());
            }
        } else {
            if (productRepository.existsByCompanyIsNullAndProductCodeIgnoreCase(request.getProductCode())) {
                throw new DuplicateResourceException("Global product code already exists: " + request.getProductCode());
            }
        }

        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        ProductCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));
        }

        ProductSubcategory subcategory = null;
        if (request.getSubcategoryId() != null) {
            subcategory = subcategoryRepository.findById(request.getSubcategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found: " + request.getSubcategoryId()));
        }

        Unit unit = null;
        if (request.getUnitId() != null) {
            unit = unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unit not found: " + request.getUnitId()));
        }

        TaxRate taxRate = null;
        if (request.getTaxRateId() != null) {
            taxRate = taxRateRepository.findById(request.getTaxRateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tax rate not found: " + request.getTaxRateId()));
        }

        Product product = Product.builder()
                .company(company)
                .productCode(request.getProductCode().trim().toUpperCase())
                .productName(request.getProductName().trim())
                .category(category)
                .subcategory(subcategory)
                .unit(unit)
                .taxRate(taxRate)
                .brand(request.getBrand())
                .modelNo(request.getModelNo())
                .partNumber(request.getPartNumber())
                .hsnCode(request.getHsnCode())
                .purchasePrice(request.getPurchasePrice() != null ? request.getPurchasePrice() : BigDecimal.ZERO)
                .sellingPrice(request.getSellingPrice() != null ? request.getSellingPrice() : BigDecimal.ZERO)
                .minimumSellingPrice(request.getMinimumSellingPrice() != null ? request.getMinimumSellingPrice() : BigDecimal.ZERO)
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : BigDecimal.ZERO)
                .minimumStock(request.getMinimumStock() != null ? request.getMinimumStock() : BigDecimal.ZERO)
                .maximumStock(request.getMaximumStock())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        // If product code changed, check uniqueness
        if (!product.getProductCode().equalsIgnoreCase(request.getProductCode())) {
            if (product.getCompany() != null) {
                if (productRepository.existsByCompanyIdAndProductCodeIgnoreCase(product.getCompany().getId(), request.getProductCode())) {
                    throw new DuplicateResourceException("Product code already exists for company: " + request.getProductCode());
                }
            } else {
                if (productRepository.existsByCompanyIsNullAndProductCodeIgnoreCase(request.getProductCode())) {
                    throw new DuplicateResourceException("Global product code already exists: " + request.getProductCode());
                }
            }
            product.setProductCode(request.getProductCode().trim().toUpperCase());
        }

        product.setProductName(request.getProductName().trim());

        if (request.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        if (request.getSubcategoryId() != null) {
            ProductSubcategory subcategory = subcategoryRepository.findById(request.getSubcategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subcategory not found: " + request.getSubcategoryId()));
            product.setSubcategory(subcategory);
        } else {
            product.setSubcategory(null);
        }

        if (request.getUnitId() != null) {
            Unit unit = unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unit not found: " + request.getUnitId()));
            product.setUnit(unit);
        } else {
            product.setUnit(null);
        }

        if (request.getTaxRateId() != null) {
            TaxRate taxRate = taxRateRepository.findById(request.getTaxRateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tax rate not found: " + request.getTaxRateId()));
            product.setTaxRate(taxRate);
        } else {
            product.setTaxRate(null);
        }

        product.setBrand(request.getBrand());
        product.setModelNo(request.getModelNo());
        product.setPartNumber(request.getPartNumber());
        product.setHsnCode(request.getHsnCode());

        if (request.getPurchasePrice() != null) product.setPurchasePrice(request.getPurchasePrice());
        if (request.getSellingPrice() != null) product.setSellingPrice(request.getSellingPrice());
        if (request.getMinimumSellingPrice() != null) product.setMinimumSellingPrice(request.getMinimumSellingPrice());
        if (request.getReorderLevel() != null) product.setReorderLevel(request.getReorderLevel());
        if (request.getMinimumStock() != null) product.setMinimumStock(request.getMinimumStock());
        product.setMaximumStock(request.getMaximumStock());
        product.setDescription(request.getDescription());
        if (request.getActive() != null) product.setActive(request.getActive());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    public ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .companyId(product.getCompany() != null ? product.getCompany().getId() : null)
                .companyName(product.getCompany() != null ? product.getCompany().getCompanyName() : null)
                .isGlobal(product.getCompany() == null)
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categoryCode(product.getCategory() != null ? product.getCategory().getCode() : null)
                .subcategoryId(product.getSubcategory() != null ? product.getSubcategory().getId() : null)
                .subcategoryName(product.getSubcategory() != null ? product.getSubcategory().getName() : null)
                .unitId(product.getUnit() != null ? product.getUnit().getId() : null)
                .unitName(product.getUnit() != null ? product.getUnit().getName() : null)
                .unitShortCode(product.getUnit() != null ? product.getUnit().getShortCode() : null)
                .taxRateId(product.getTaxRate() != null ? product.getTaxRate().getId() : null)
                .taxRateName(product.getTaxRate() != null ? product.getTaxRate().getName() : null)
                .gstRate(product.getTaxRate() != null ? product.getTaxRate().getGstRate() : null)
                .brand(product.getBrand())
                .modelNo(product.getModelNo())
                .partNumber(product.getPartNumber())
                .hsnCode(product.getHsnCode())
                .purchasePrice(product.getPurchasePrice())
                .sellingPrice(product.getSellingPrice())
                .minimumSellingPrice(product.getMinimumSellingPrice())
                .reorderLevel(product.getReorderLevel())
                .minimumStock(product.getMinimumStock())
                .maximumStock(product.getMaximumStock())
                .description(product.getDescription())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}

