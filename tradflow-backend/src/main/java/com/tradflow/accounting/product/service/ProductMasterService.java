package com.tradflow.accounting.product.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.product.dto.ProductMasterDtos.*;
import com.tradflow.accounting.product.entity.ProductCategory;
import com.tradflow.accounting.product.entity.ProductSubcategory;
import com.tradflow.accounting.product.entity.TaxRate;
import com.tradflow.accounting.product.entity.Unit;
import com.tradflow.accounting.product.repository.ProductCategoryRepository;
import com.tradflow.accounting.product.repository.ProductSubcategoryRepository;
import com.tradflow.accounting.product.repository.TaxRateRepository;
import com.tradflow.accounting.product.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductMasterService {

    private final ProductCategoryRepository categoryRepository;
    private final ProductSubcategoryRepository subcategoryRepository;
    private final UnitRepository unitRepository;
    private final TaxRateRepository taxRateRepository;
    private final CompanyRepository companyRepository;

    // ==========================================
    // CATEGORIES
    // ==========================================
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(UUID companyId) {
        List<ProductCategory> list = (companyId != null)
                ? categoryRepository.findAccessibleByCompany(companyId)
                : categoryRepository.findByCompanyIsNullAndActiveTrueOrderByNameAsc();
        return list.stream().map(this::toCategoryResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (request.getCompanyId() != null) {
            if (categoryRepository.existsByCompanyIdAndCodeIgnoreCase(request.getCompanyId(), request.getCode())) {
                throw new DuplicateResourceException("Category code already exists for company: " + request.getCode());
            }
        } else {
            if (categoryRepository.existsByCompanyIsNullAndCodeIgnoreCase(request.getCode())) {
                throw new DuplicateResourceException("Global category code already exists: " + request.getCode());
            }
        }

        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        ProductCategory category = ProductCategory.builder()
                .company(company)
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));

        category.setName(request.getName().trim());
        if (request.getActive() != null) category.setActive(request.getActive());
        if (request.getDescription() != null) category.setDescription(request.getDescription());

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID id) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        category.setActive(false);
        categoryRepository.save(category);
    }

    // ==========================================
    // SUBCATEGORIES
    // ==========================================
    @Transactional(readOnly = true)
    public List<SubcategoryResponse> getSubcategories(UUID categoryId, UUID companyId) {
        List<ProductSubcategory> list = (companyId != null)
                ? subcategoryRepository.findByCategoryIdAndAccessibleCompany(categoryId, companyId)
                : subcategoryRepository.findByCategoryIdAndActiveTrueOrderByNameAsc(categoryId);
        return list.stream().map(this::toSubcategoryResponse).collect(Collectors.toList());
    }

    @Transactional
    public SubcategoryResponse createSubcategory(SubcategoryRequest request) {
        ProductCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent Category not found: " + request.getCategoryId()));

        if (request.getCompanyId() != null) {
            if (subcategoryRepository.existsByCompanyIdAndCodeIgnoreCase(request.getCompanyId(), request.getCode())) {
                throw new DuplicateResourceException("Subcategory code already exists: " + request.getCode());
            }
        } else {
            if (subcategoryRepository.existsByCompanyIsNullAndCodeIgnoreCase(request.getCode())) {
                throw new DuplicateResourceException("Global subcategory code already exists: " + request.getCode());
            }
        }

        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        ProductSubcategory sub = ProductSubcategory.builder()
                .company(company)
                .category(category)
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toSubcategoryResponse(subcategoryRepository.save(sub));
    }

    // ==========================================
    // UNITS
    // ==========================================
    @Transactional(readOnly = true)
    public List<UnitResponse> getUnits(UUID companyId) {
        List<Unit> list = (companyId != null)
                ? unitRepository.findAccessibleByCompany(companyId)
                : unitRepository.findByCompanyIsNullAndActiveTrueOrderByNameAsc();
        return list.stream().map(this::toUnitResponse).collect(Collectors.toList());
    }

    @Transactional
    public UnitResponse createUnit(UnitRequest request) {
        if (request.getCompanyId() != null) {
            if (unitRepository.existsByCompanyIdAndShortCodeIgnoreCase(request.getCompanyId(), request.getShortCode())) {
                throw new DuplicateResourceException("Unit short code already exists: " + request.getShortCode());
            }
        } else {
            if (unitRepository.existsByCompanyIsNullAndShortCodeIgnoreCase(request.getShortCode())) {
                throw new DuplicateResourceException("Global unit code already exists: " + request.getShortCode());
            }
        }

        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        Unit unit = Unit.builder()
                .company(company)
                .name(request.getName().trim())
                .shortCode(request.getShortCode().trim().toUpperCase())
                .decimalAllowed(request.getDecimalAllowed() != null ? request.getDecimalAllowed() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toUnitResponse(unitRepository.save(unit));
    }

    // ==========================================
    // TAX RATES
    // ==========================================
    @Transactional(readOnly = true)
    public List<TaxRateResponse> getTaxRates(UUID companyId) {
        List<TaxRate> list = (companyId != null)
                ? taxRateRepository.findAccessibleByCompany(companyId)
                : taxRateRepository.findByCompanyIsNullAndActiveTrueOrderByGstRateAsc();
        return list.stream().map(this::toTaxRateResponse).collect(Collectors.toList());
    }

    @Transactional
    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        if (request.getCompanyId() != null) {
            if (taxRateRepository.existsByCompanyIdAndNameIgnoreCase(request.getCompanyId(), request.getName())) {
                throw new DuplicateResourceException("Tax rate name already exists: " + request.getName());
            }
        } else {
            if (taxRateRepository.existsByCompanyIsNullAndNameIgnoreCase(request.getName())) {
                throw new DuplicateResourceException("Global tax rate name already exists: " + request.getName());
            }
        }

        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        TaxRate taxRate = TaxRate.builder()
                .company(company)
                .name(request.getName().trim())
                .gstRate(request.getGstRate())
                .cgstRate(request.getCgstRate())
                .sgstRate(request.getSgstRate())
                .igstRate(request.getIgstRate())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toTaxRateResponse(taxRateRepository.save(taxRate));
    }

    // ==========================================
    // MAPPERS
    // ==========================================
    public CategoryResponse toCategoryResponse(ProductCategory entity) {
        return CategoryResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompany() != null ? entity.getCompany().getId() : null)
                .name(entity.getName())
                .code(entity.getCode())
                .description(entity.getDescription())
                .active(entity.getActive())
                .isGlobal(entity.getCompany() == null)
                .build();
    }

    public SubcategoryResponse toSubcategoryResponse(ProductSubcategory entity) {
        return SubcategoryResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompany() != null ? entity.getCompany().getId() : null)
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .name(entity.getName())
                .code(entity.getCode())
                .active(entity.getActive())
                .isGlobal(entity.getCompany() == null)
                .build();
    }

    public UnitResponse toUnitResponse(Unit entity) {
        return UnitResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompany() != null ? entity.getCompany().getId() : null)
                .name(entity.getName())
                .shortCode(entity.getShortCode())
                .decimalAllowed(entity.getDecimalAllowed())
                .active(entity.getActive())
                .isGlobal(entity.getCompany() == null)
                .build();
    }

    public TaxRateResponse toTaxRateResponse(TaxRate entity) {
        return TaxRateResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompany() != null ? entity.getCompany().getId() : null)
                .name(entity.getName())
                .gstRate(entity.getGstRate())
                .cgstRate(entity.getCgstRate())
                .sgstRate(entity.getSgstRate())
                .igstRate(entity.getIgstRate())
                .active(entity.getActive())
                .isGlobal(entity.getCompany() == null)
                .build();
    }
}

