package com.tradflow.accounting.company.service;

import com.tradflow.accounting.common.exception.DuplicateResourceException;
import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.dto.AssignUserCompanyRequest;
import com.tradflow.accounting.company.dto.CompanyRequest;
import com.tradflow.accounting.company.dto.CompanyResponse;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.entity.UserCompany;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.company.repository.UserCompanyRepository;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final UserRepository userRepository;

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        if (companyRepository.existsByCompanyCode(request.getCompanyCode())) {
            throw new DuplicateResourceException("Company code already exists: " + request.getCompanyCode());
        }
        Company company = Company.builder()
                .companyCode(request.getCompanyCode())
                .companyName(request.getCompanyName())
                .tradeName(request.getTradeName())
                .gstin(request.getGstin())
                .pan(request.getPan())
                .email(request.getEmail())
                .phone(request.getPhone())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .stateId(request.getStateId())
                .pincode(request.getPincode())
                .country(request.getCountry() == null ? "India" : request.getCountry())
                .currencyCode(request.getCurrencyCode() == null ? "INR" : request.getCurrencyCode())
                .financialYearStart(request.getFinancialYearStart())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return toResponse(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(UUID id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAll() {
        return companyRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CompanyResponse> getPage(String company, String state, String city, int page, int size) {
        int normalizedPage = Math.max(0, page);
        int normalizedSize = size <= 0 ? 50 : size;

        Specification<Company> spec = (root, query, cb) -> cb.conjunction();

        if (company != null && !company.isBlank()) {
            String term = company.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("companyName")), "%" + term + "%"));
        }

        if (city != null && !city.isBlank()) {
            String term = city.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("city")), "%" + term + "%"));
        }

        if (state != null && !state.isBlank()) {
            try {
                Long stateId = Long.parseLong(state.trim());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("stateId"), stateId));
            } catch (NumberFormatException ignored) {
                // Keep non-numeric state filter values harmlessly ignored instead of failing the whole page.
            }
        }

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("companyName").ascending());
        return companyRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional
    public CompanyResponse update(UUID id, CompanyRequest request) {
        Company company = findEntity(id);

        if (!company.getCompanyCode().equals(request.getCompanyCode())
                && companyRepository.existsByCompanyCode(request.getCompanyCode())) {
            throw new DuplicateResourceException("Company code already exists: " + request.getCompanyCode());
        }

        company.setCompanyCode(request.getCompanyCode());
        company.setCompanyName(request.getCompanyName());
        company.setTradeName(request.getTradeName());
        company.setGstin(request.getGstin());
        company.setPan(request.getPan());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setAddressLine1(request.getAddressLine1());
        company.setAddressLine2(request.getAddressLine2());
        company.setCity(request.getCity());
        company.setStateId(request.getStateId());
        company.setPincode(request.getPincode());
        if (request.getCountry() != null) company.setCountry(request.getCountry());
        if (request.getCurrencyCode() != null) company.setCurrencyCode(request.getCurrencyCode());
        company.setFinancialYearStart(request.getFinancialYearStart());
        if (request.getActive() != null) company.setActive(request.getActive());

        return toResponse(companyRepository.save(company));
    }

    @Transactional
    public void delete(UUID id) {
        Company company = findEntity(id);
        company.setActive(false);
        companyRepository.save(company);
    }

    @Transactional
    public void assignUserToCompany(AssignUserCompanyRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", request.getUserId()));
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> ResourceNotFoundException.of("Company", request.getCompanyId()));

        if (userCompanyRepository.existsByUserIdAndCompanyId(user.getId(), company.getId())) {
            throw new DuplicateResourceException("User is already assigned to this company");
        }

        UserCompany userCompany = UserCompany.builder()
                .user(user)
                .company(company)
                .isDefault(request.getIsDefault() != null && request.getIsDefault())
                .active(true)
                .build();

        userCompanyRepository.save(userCompany);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> getCompaniesForUser(UUID userId) {
        return userCompanyRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(UserCompany::getCompany)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Company findEntity(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Company", id));
    }

    private CompanyResponse toResponse(Company c) {
        return CompanyResponse.builder()
                .id(c.getId())
                .companyCode(c.getCompanyCode())
                .companyName(c.getCompanyName())
                .tradeName(c.getTradeName())
                .gstin(c.getGstin())
                .pan(c.getPan())
                .email(c.getEmail())
                .phone(c.getPhone())
                .addressLine1(c.getAddressLine1())
                .addressLine2(c.getAddressLine2())
                .city(c.getCity())
                .stateId(c.getStateId())
                .pincode(c.getPincode())
                .country(c.getCountry())
                .currencyCode(c.getCurrencyCode())
                .financialYearStart(c.getFinancialYearStart())
                .active(c.getActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
