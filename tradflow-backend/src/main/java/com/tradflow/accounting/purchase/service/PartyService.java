package com.tradflow.accounting.purchase.service;

import com.tradflow.accounting.common.exception.ResourceNotFoundException;
import com.tradflow.accounting.company.entity.Company;
import com.tradflow.accounting.company.repository.CompanyRepository;
import com.tradflow.accounting.purchase.dto.PartyDtos.PartyRequest;
import com.tradflow.accounting.purchase.dto.PartyDtos.PartyResponse;
import com.tradflow.accounting.purchase.entity.Party;
import com.tradflow.accounting.purchase.repository.PartyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartyService {

    private final PartyRepository partyRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<PartyResponse> getSuppliers(UUID companyId) {
        List<Party> list = (companyId != null)
                ? partyRepository.findAccessibleByCompanyAndType(companyId, "SUPPLIER")
                : partyRepository.findByCompanyIsNullAndActiveTrueOrderByPartyNameAsc();
        return list.stream().filter(p -> Boolean.TRUE.equals(p.getActive())).map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<PartyResponse> getCustomers(UUID companyId) {
        List<Party> list = (companyId != null)
                ? partyRepository.findAccessibleByCompanyAndType(companyId, "CUSTOMER")
                : partyRepository.findByCompanyIsNullAndActiveTrueOrderByPartyNameAsc();

        if (list.isEmpty()) {
            Company company = (companyId != null) ? companyRepository.findById(companyId).orElse(null) : null;
            Party c1 = Party.builder()
                    .company(company)
                    .partyType("CUSTOMER")
                    .partyName("Apex Electricals & Automation Ltd")
                    .contactPerson("Rajesh Sharma")
                    .email("sales@apexelectricals.in")
                    .phone("+91 98765 43210")
                    .country("India")
                    .currencyCode("INR")
                    .address("Plot 42, Phase II, Okhla Industrial Area, New Delhi")
                    .gstin("07AAAAA0000A1Z5")
                    .active(true)
                    .build();
            partyRepository.save(c1);

            Party c2 = Party.builder()
                    .company(company)
                    .partyType("CUSTOMER")
                    .partyName("Shreeji Power & Controls (Local Retail)")
                    .contactPerson("Bhavik Patel")
                    .email("bhavik@shreejitraders.com")
                    .phone("+91 98250 12345")
                    .country("India")
                    .currencyCode("INR")
                    .address("Market Yard, Station Road, Ahmedabad, Gujarat")
                    .gstin("24BBBBB1111B1Z2")
                    .active(true)
                    .build();
            partyRepository.save(c2);

            Party c3 = Party.builder()
                    .company(company)
                    .partyType("CUSTOMER")
                    .partyName("V-Tech Switchgears Pvt Ltd")
                    .contactPerson("Vikram Malhotra")
                    .email("vikram@vtechswitchgears.com")
                    .phone("+91 97110 55443")
                    .country("India")
                    .currencyCode("INR")
                    .address("Sector 18, Electronic Zone, Gurugram, Haryana")
                    .gstin("06CCCCC2222C1Z8")
                    .active(true)
                    .build();
            partyRepository.save(c3);

            list = (companyId != null)
                    ? partyRepository.findAccessibleByCompanyAndType(companyId, "CUSTOMER")
                    : partyRepository.findByCompanyIsNullAndActiveTrueOrderByPartyNameAsc();
        }

        return list.stream().filter(p -> Boolean.TRUE.equals(p.getActive())).map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PartyResponse> getParties(UUID companyId) {
        List<Party> list = (companyId != null)
                ? partyRepository.findAccessibleByCompany(companyId)
                : partyRepository.findByCompanyIsNullAndActiveTrueOrderByPartyNameAsc();
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PartyResponse getById(UUID id) {
        return toResponse(partyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Party not found: " + id)));
    }

    @Transactional
    public PartyResponse create(PartyRequest request) {
        Company company = null;
        if (request.getCompanyId() != null) {
            company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.getCompanyId()));
        }

        Party party = Party.builder()
                .company(company)
                .partyType(request.getPartyType() != null ? request.getPartyType() : "SUPPLIER")
                .partyName(request.getPartyName().trim())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .country(request.getCountry() != null ? request.getCountry() : "China")
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "CNY")
                .address(request.getAddress())
                .gstin(request.getGstin())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(partyRepository.save(party));
    }

    public PartyResponse toResponse(Party p) {
        return PartyResponse.builder()
                .id(p.getId())
                .companyId(p.getCompany() != null ? p.getCompany().getId() : null)
                .partyType(p.getPartyType())
                .partyName(p.getPartyName())
                .contactPerson(p.getContactPerson())
                .email(p.getEmail())
                .phone(p.getPhone())
                .country(p.getCountry())
                .currencyCode(p.getCurrencyCode())
                .address(p.getAddress())
                .gstin(p.getGstin())
                .active(p.getActive())
                .build();
    }
}

