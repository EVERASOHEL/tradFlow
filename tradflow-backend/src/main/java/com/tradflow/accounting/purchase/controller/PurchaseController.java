package com.tradflow.accounting.purchase.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.purchase.dto.PurchaseDtos.PurchaseRequest;
import com.tradflow.accounting.purchase.dto.PurchaseDtos.PurchaseResponse;
import com.tradflow.accounting.purchase.dto.PurchaseDtos.SupplierPurchaseSummary;
import com.tradflow.accounting.purchase.service.PurchaseService;
import com.tradflow.accounting.security.context.SecurityUser;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('PURCHASE_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<PurchaseResponse>>> getPurchases(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "purchaseDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return CommonResponse.getData(purchaseService.getPage(companyId, supplierId, transactionType, status, search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PURCHASE_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<PurchaseResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(purchaseService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PURCHASE_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<PurchaseResponse>> create(
            @Valid @RequestBody PurchaseRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        return CommonResponse.created(purchaseService.create(request, user), "Purchase invoice created successfully");
    }

    @GetMapping("/supplier-summary")
    @PreAuthorize("hasAuthority('PURCHASE_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<SupplierPurchaseSummary>>> getSupplierSummaries(
            @RequestParam UUID companyId
    ) {
        return CommonResponse.getData(purchaseService.getSupplierSummaries(companyId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PURCHASE_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> delete(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        purchaseService.delete(id, user);
        return CommonResponse.getData((Void) null, "Purchase invoice deleted");
    }

    private User resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof SecurityUser secUser) {
            return userRepository.findById(secUser.getUserId()).orElse(null);
        }
        return null;
    }
}
