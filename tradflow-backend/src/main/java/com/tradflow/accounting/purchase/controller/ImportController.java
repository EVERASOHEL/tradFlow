package com.tradflow.accounting.purchase.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.purchase.dto.ImportDtos.*;
import com.tradflow.accounting.purchase.service.ImportService;
import com.tradflow.accounting.purchase.service.MarketRatesService;
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
@RequestMapping("/api/imports")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;
    private final MarketRatesService marketRatesService;
    private final UserRepository userRepository;

    @GetMapping("/market-rates")
    @PreAuthorize("hasAuthority('IMPORT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<MarketRatesResponse>> getMarketRates(
            @RequestParam(defaultValue = "false") boolean refresh
    ) {
        return CommonResponse.getData(marketRatesService.getLiveMarketRates(refresh));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('IMPORT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<ImportResponse>>> getImports(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return CommonResponse.getData(importService.getPage(companyId, search, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('IMPORT_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ImportResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(importService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('IMPORT_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ImportResponse>> create(
            @Valid @RequestBody ImportCreateRequest request,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        return CommonResponse.created(importService.create(request, user), "Import shipment booked successfully");
    }

    @PutMapping("/{id}/stage")
    @PreAuthorize("hasAuthority('IMPORT_UPDATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<ImportResponse>> updateStage(
            @PathVariable UUID id,
            @Valid @RequestBody ImportStageUpdateRequest request
    ) {
        return CommonResponse.getData(importService.updateStage(id, request), "Import shipment stage updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('IMPORT_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        importService.delete(id);
        return CommonResponse.getData((Void) null, "Import shipment deleted");
    }

    private User resolveUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof SecurityUser secUser) {
            return userRepository.findById(secUser.getUserId()).orElse(null);
        }
        return null;
    }
}
