package com.tradflow.accounting.purchase.entity;

import com.tradflow.accounting.common.audit.Auditable;
import com.tradflow.accounting.company.entity.Company;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "parties")
public class Party extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Builder.Default
    @Column(name = "party_type", nullable = false, length = 20)
    private String partyType = "SUPPLIER";

    @Column(name = "party_name", nullable = false, length = 200)
    private String partyName;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Builder.Default
    @Column(name = "country", length = 100)
    private String country = "China";

    @Builder.Default
    @Column(name = "currency_code", length = 10)
    private String currencyCode = "CNY";

    @Column(name = "address")
    private String address;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}

