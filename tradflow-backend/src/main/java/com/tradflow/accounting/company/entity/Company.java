package com.tradflow.accounting.company.entity;

import com.tradflow.accounting.common.audit.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies", uniqueConstraints = {
        @UniqueConstraint(name = "uq_companies_code", columnNames = "company_code")
})
public class Company extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_code", nullable = false, length = 30)
    private String companyCode;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "trade_name", length = 200)
    private String tradeName;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "pan", length = 10)
    private String pan;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state_id")
    private Long stateId;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Builder.Default
    @Column(name = "country", nullable = false, length = 100)
    private String country = "India";

    @Builder.Default
    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode = "INR";

    @Column(name = "financial_year_start")
    private LocalDate financialYearStart;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}
