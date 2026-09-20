package com.tradflow.accounting.purchase.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

public class PartyDtos {

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartyRequest {
        private UUID companyId;

        @Builder.Default
        private String partyType = "SUPPLIER";

        @NotBlank(message = "Party name is required")
        private String partyName;

        private String contactPerson;
        private String email;
        private String phone;
        private String country;
        private String currencyCode;
        private String address;
        private String gstin;
        private Boolean active;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartyResponse {
        private UUID id;
        private UUID companyId;
        private String partyType;
        private String partyName;
        private String contactPerson;
        private String email;
        private String phone;
        private String country;
        private String currencyCode;
        private String address;
        private String gstin;
        private Boolean active;
    }
}

