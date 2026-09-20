package com.tradflow.accounting.purchase.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradflow.accounting.purchase.dto.ImportDtos.MarketRatesResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MarketRatesServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MarketRatesService marketRatesService = new MarketRatesService(objectMapper);

    @Test
    void testGetLiveMarketRatesReturnsValidRates() {
        MarketRatesResponse response = marketRatesService.getLiveMarketRates(true);

        assertThat(response).isNotNull();
        assertThat(response.getExchangeRate()).isNotNull();
        assertThat(response.getExchangeRate()).isGreaterThan(BigDecimal.ZERO);

        assertThat(response.getSilverRate()).isNotNull();
        assertThat(response.getSilverRate()).isGreaterThan(BigDecimal.ZERO);

        assertThat(response.getCopperRate()).isNotNull();
        assertThat(response.getCopperRate()).isGreaterThan(BigDecimal.ZERO);

        assertThat(response.getStatus()).isNotNull();
        assertThat(response.getLastUpdated()).isNotBlank();
    }

    @Test
    void testCachingReturnsCachedResponse() {
        MarketRatesResponse first = marketRatesService.getLiveMarketRates(true);
        MarketRatesResponse cached = marketRatesService.getLiveMarketRates(false);

        assertThat(cached).isNotNull();
        assertThat(cached.getExchangeRate()).isEqualTo(first.getExchangeRate());
        assertThat(cached.getSilverRate()).isEqualTo(first.getSilverRate());
        assertThat(cached.getCopperRate()).isEqualTo(first.getCopperRate());
    }
}

