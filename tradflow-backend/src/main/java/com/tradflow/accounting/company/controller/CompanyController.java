package com.tradflow.accounting.company.controller;

import com.tradflow.accounting.common.response.CommonResponse;
import com.tradflow.accounting.common.response.ResultJson;
import com.tradflow.accounting.company.dto.AssignUserCompanyRequest;
import com.tradflow.accounting.company.dto.CompanyRequest;
import com.tradflow.accounting.company.dto.CompanyResponse;
import com.tradflow.accounting.company.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    @PreAuthorize("hasAuthority('COMPANY_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<CompanyResponse>> create(@Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = companyService.create(request);
        return CommonResponse.created(response, "Company created");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultJson<CompanyResponse>> getById(@PathVariable UUID id) {
        return CommonResponse.getData(companyService.getById(id));
    }

    @GetMapping
    public ResponseEntity<ResultJson<List<CompanyResponse>>> getAll(
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return CommonResponse.getData(companyService.getPage(company, state, city, page, size));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('COMPANY_UPDATE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<CompanyResponse>> update(@PathVariable UUID id,
                                                                @Valid @RequestBody CompanyRequest request) {
        return CommonResponse.getData(companyService.update(id, request), "Company updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('COMPANY_DELETE') or hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> delete(@PathVariable UUID id) {
        companyService.delete(id);
        return CommonResponse.getData((Void) null, "Company deactivated");
    }

    @PostMapping("/assign-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultJson<Void>> assignUser(@Valid @RequestBody AssignUserCompanyRequest request) {
        companyService.assignUserToCompany(request);
        return CommonResponse.getData((Void) null, "User assigned to company");
    }

    @GetMapping("/for-user/{userId}")
    public ResponseEntity<ResultJson<List<CompanyResponse>>> getCompaniesForUser(@PathVariable UUID userId) {
        return CommonResponse.getData(companyService.getCompaniesForUser(userId));
    }
}
