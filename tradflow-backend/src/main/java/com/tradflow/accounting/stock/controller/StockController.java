package com.tradflow.accounting.stock.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.security.context.SecurityUser;
import com.tradflow.accounting.stock.dto.StockDtos.*;
import com.tradflow.accounting.stock.service.StockService;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Tag(name = "Stock & Inventory Management", description = "Current stock balances, low stock alerts, and audit ledger")
public class StockController {

    private final StockService stockService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('STOCK_VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get current stock summary for products")
    public ResponseEntity<ResultJson<List<StockItemSummary>>> getStockSummary(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Page<StockItemSummary> page = stockService.getStockSummary(companyId, search, lowStockOnly, pageable);
        return CommonResponse.getData(page, "Stock summary retrieved successfully");
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('STOCK_VIEW') or hasRole('ADMIN')")
    @Operation(summary = "Get stock movements audit ledger")
    public ResponseEntity<ResultJson<List<StockMovementResponse>>> getMovements(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String movementType,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Page<StockMovementResponse> page = stockService.getMovements(companyId, productId, movementType, pageable);
        return CommonResponse.getData(page, "Stock movements retrieved successfully");
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('STOCK_ADJUST') or hasRole('ADMIN')")
    @Operation(summary = "Manual stock adjustment")
    public ResponseEntity<ResultJson<StockMovementResponse>> adjustStock(
            @RequestBody StockAdjustmentRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        StockMovementResponse response = stockService.adjustStock(request, user);
        return CommonResponse.getData(response, "Stock adjusted successfully");
    }

    private User resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof SecurityUser secUser) {
            return userRepository.findById(secUser.getUserId()).orElse(null);
        }
        return null;
    }
}
