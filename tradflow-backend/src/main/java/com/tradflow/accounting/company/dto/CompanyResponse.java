package com.tradflow.accounting.company.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {
    private UUID id;
    private String companyCode;
    private String companyName;
    private String tradeName;
    private String gstin;
    private String pan;
    private String email;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private Long stateId;
    private String pincode;
    private String country;
    private String currencyCode;
    private LocalDate financialYearStart;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
