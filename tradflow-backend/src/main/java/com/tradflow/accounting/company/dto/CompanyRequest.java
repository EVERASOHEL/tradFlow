package com.tradflow.accounting.company.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompanyRequest {

    @NotBlank(message = "Company code is required")
    @Size(max = 30)
    private String companyCode;

    @NotBlank(message = "Company name is required")
    @Size(max = 200)
    private String companyName;

    private String tradeName;

    @Size(max = 15, message = "GSTIN must be at most 15 characters")
    private String gstin;

    @Size(max = 10, message = "PAN must be at most 10 characters")
    private String pan;

    @Email(message = "Email must be valid")
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
}
