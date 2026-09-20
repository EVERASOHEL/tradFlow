package com.tradflow.accounting.sale.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.sale.dto.SaleDtos.*;
import com.tradflow.accounting.sale.service.SaleService;
import com.tradflow.accounting.security.context.SecurityUser;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Sales Management", description = "GST and Non-GST Sales Invoices with real-time stock reduction")
public class SaleController {

    private final SaleService saleService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('SALE_VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get paginated list of sales invoices with filters")
    public ResponseEntity<ResultJson<List<SaleResponse>>> getPage(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<SaleResponse> page = saleService.getPage(companyId, customerId, transactionType, status, search, pageable);
        return CommonResponse.getData(page, "Sales invoices retrieved successfully");
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SALE_VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get sale invoice details by ID")
    public ResponseEntity<ResultJson<SaleResponse>> getById(@PathVariable UUID id) {
        SaleResponse response = saleService.getById(id);
        return CommonResponse.getData(response, "Sale invoice details retrieved");
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SALE_CREATE') or hasRole('ADMIN')")
    @Operation(summary = "Create GST or Non-GST sales invoice and deduct stock")
    public ResponseEntity<ResultJson<SaleResponse>> create(
            @Valid @RequestBody SaleRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        SaleResponse response = saleService.create(request, user);
        return CommonResponse.created(response, "Sale invoice recorded successfully and stock updated");
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('SALE_DELETE') or hasRole('ADMIN')")
    @Operation(summary = "Cancel sales invoice and restore stock")
    public ResponseEntity<ResultJson<SaleResponse>> cancel(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        SaleResponse response = saleService.cancel(id, user);
        return CommonResponse.getData(response, "Sale invoice cancelled and stock restored");
    }

    private User resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof SecurityUser secUser) {
            return userRepository.findById(secUser.getUserId()).orElse(null);
        }
        return null;
    }
}
