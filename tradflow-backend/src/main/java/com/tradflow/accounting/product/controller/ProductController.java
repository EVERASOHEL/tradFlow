package com.tradflow.accounting.product.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.product.dto.ProductRequest;
import com.tradflow.accounting.product.dto.ProductResponse;
import com.tradflow.accounting.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<ProductResponse>>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) Boolean isGlobalOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "productName") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return CommonResponse.getData(productService.getPage(search, categoryId, companyId, isGlobalOnly, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ProductResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(productService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        return CommonResponse.created(productService.create(request), "Product created successfully");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ProductResponse>> update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return CommonResponse.getData(productService.update(id, request), "Product updated successfully");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return CommonResponse.getData((Void) null, "Product deactivated");
    }
}

