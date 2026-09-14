package com.tradflow.accounting.product.entity;

import com.tradflow.accounting.company.entity.Company;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "units")
public class Unit {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "short_code", nullable = false, length = 20)
    private String shortCode;

    @Builder.Default
    @Column(name = "decimal_allowed", nullable = false)
    private Boolean decimalAllowed = false;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}

