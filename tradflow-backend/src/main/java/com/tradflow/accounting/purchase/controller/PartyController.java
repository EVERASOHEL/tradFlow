package com.tradflow.accounting.purchase.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.purchase.dto.PartyDtos.PartyRequest;
import com.tradflow.accounting.purchase.dto.PartyDtos.PartyResponse;
import com.tradflow.accounting.purchase.service.PartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/parties")
@RequiredArgsConstructor
public class PartyController {

    private final PartyService partyService;

    @GetMapping
    @PreAuthorize("hasAuthority('PARTY_VIEW') or hasAuthority('PURCHASE_VIEW') or hasAuthority('IMPORT_VIEW') or hasAuthority('SALE_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<List<PartyResponse>>> getParties(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(defaultValue = "SUPPLIER") String type
    ) {
        if ("CUSTOMER".equalsIgnoreCase(type)) {
            return CommonResponse.getData(partyService.getCustomers(companyId));
        } else if ("SUPPLIER".equalsIgnoreCase(type)) {
            return CommonResponse.getData(partyService.getSuppliers(companyId));
        }
        return CommonResponse.getData(partyService.getParties(companyId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PARTY_VIEW') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<PartyResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(partyService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PARTY_MANAGE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<PartyResponse>> create(@Valid @RequestBody PartyRequest request) {
        return CommonResponse.created(partyService.create(request), "Supplier party created successfully");
    }
}

