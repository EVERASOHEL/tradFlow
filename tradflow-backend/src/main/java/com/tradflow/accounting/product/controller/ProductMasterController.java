package com.tradflow.accounting.product.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.product.dto.ProductMasterDtos.*;
import com.tradflow.accounting.product.service.ProductMasterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-masters")
@RequiredArgsConstructor
public class ProductMasterController {

    private final ProductMasterService productMasterService;

    // ==========================================
    // CATEGORIES
    // ==========================================
    @GetMapping("/categories")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<CategoryResponse>>> getCategories(@RequestParam(required = false) UUID companyId) {
        return CommonResponse.getData(productMasterService.getCategories(companyId));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return CommonResponse.created(productMasterService.createCategory(request), "Category created");
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<CategoryResponse>> updateCategory(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return CommonResponse.getData(productMasterService.updateCategory(id, request), "Category updated");
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> deleteCategory(@PathVariable UUID id) {
        productMasterService.deleteCategory(id);
        return CommonResponse.getData((Void) null, "Category deleted");
    }

    // ==========================================
    // SUBCATEGORIES
    // ==========================================
    @GetMapping("/subcategories")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<SubcategoryResponse>>> getSubcategories(
            @RequestParam UUID categoryId,
            @RequestParam(required = false) UUID companyId
    ) {
        return CommonResponse.getData(productMasterService.getSubcategories(categoryId, companyId));
    }

    @PostMapping("/subcategories")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<SubcategoryResponse>> createSubcategory(@Valid @RequestBody SubcategoryRequest request) {
        return CommonResponse.created(productMasterService.createSubcategory(request), "Subcategory created");
    }

    // ==========================================
    // UNITS
    // ==========================================
    @GetMapping("/units")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<UnitResponse>>> getUnits(@RequestParam(required = false) UUID companyId) {
        return CommonResponse.getData(productMasterService.getUnits(companyId));
    }

    @PostMapping("/units")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<UnitResponse>> createUnit(@Valid @RequestBody UnitRequest request) {
        return CommonResponse.created(productMasterService.createUnit(request), "Unit created");
    }

    // ==========================================
    // TAX RATES
    // ==========================================
    @GetMapping("/tax-rates")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<TaxRateResponse>>> getTaxRates(@RequestParam(required = false) UUID companyId) {
        return CommonResponse.getData(productMasterService.getTaxRates(companyId));
    }

    @PostMapping("/tax-rates")
    @PreAuthorize("hasAuthority('PRODUCT_MASTER_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<TaxRateResponse>> createTaxRate(@Valid @RequestBody TaxRateRequest request) {
        return CommonResponse.created(productMasterService.createTaxRate(request), "Tax rate created");
    }
}

