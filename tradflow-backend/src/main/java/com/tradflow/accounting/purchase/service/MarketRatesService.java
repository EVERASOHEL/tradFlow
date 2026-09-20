package com.tradflow.accounting.purchase.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradflow.accounting.purchase.dto.ImportDtos.MarketRatesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class MarketRatesService {

    private final ObjectMapper objectMapper;

    public MarketRatesService() {
        this.objectMapper = new ObjectMapper();
    }

    public MarketRatesService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    // Conversion Constants
    // 1 kg = 32.15074656 troy ounces
    private static final double TROY_OZ_PER_KG = 32.15074656;
    // 1 kg = 2.20462262 pounds (lbs)
    private static final double LBS_PER_KG = 2.20462262;

    // Fallback baselines
    private static final BigDecimal DEFAULT_CNY_INR = BigDecimal.valueOf(14.30);
    private static final BigDecimal DEFAULT_USD_INR = BigDecimal.valueOf(86.50);
    private static final BigDecimal DEFAULT_SILVER_INR_KG = BigDecimal.valueOf(92000.00);
    private static final BigDecimal DEFAULT_COPPER_INR_KG = BigDecimal.valueOf(840.00);

    // Cache state (10 minute TTL)
    private volatile MarketRatesResponse cachedRates = null;
    private volatile Instant lastFetchInstant = null;
    private static final long CACHE_TTL_SECONDS = 600;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public MarketRatesResponse getLiveMarketRates() {
        return getLiveMarketRates(false);
    }

    public MarketRatesResponse getLiveMarketRates(boolean forceRefresh) {
        if (!forceRefresh && cachedRates != null && lastFetchInstant != null) {
            long ageSeconds = Duration.between(lastFetchInstant, Instant.now()).getSeconds();
            if (ageSeconds < CACHE_TTL_SECONDS) {
                log.debug("Serving market rates from cache (age: {}s)", ageSeconds);
                return cachedRates;
            }
        }

        try {
            MarketRatesResponse liveRates = fetchRatesFromSources();
            if (liveRates != null) {
                cachedRates = liveRates;
                lastFetchInstant = Instant.now();
                return liveRates;
            }
        } catch (Exception e) {
            log.warn("Error fetching live rates, utilizing cache or fallback: {}", e.getMessage());
        }

        if (cachedRates != null) {
            return cachedRates;
        }

        return createFallbackResponse();
    }

    private MarketRatesResponse fetchRatesFromSources() {
        // 1. Fetch CNY/INR & USD/INR Forex Rates
        Double cnyToInr = null;
        Double usdToInr = null;

        try {
            HttpRequest forexReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://open.er-api.com/v6/latest/CNY"))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();

            HttpResponse<String> forexRes = httpClient.send(forexReq, HttpResponse.BodyHandlers.ofString());
            if (forexRes.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(forexRes.body());
                JsonNode rates = root.path("rates");
                if (rates.has("INR")) {
                    cnyToInr = rates.path("INR").asDouble();
                }
                if (rates.has("USD") && rates.path("USD").asDouble() > 0) {
                    double cnyToUsd = rates.path("USD").asDouble();
                    usdToInr = cnyToInr != null ? (cnyToInr / cnyToUsd) : null;
                }
            }
        } catch (Exception e) {
            log.warn("Forex fetch failed from open.er-api: {}", e.getMessage());
        }

        // Secondary fallback for Forex if needed
        if (cnyToInr == null) {
            try {
                HttpRequest frankReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.frankfurter.app/latest?from=CNY&to=INR"))
                        .timeout(Duration.ofSeconds(4))
                        .GET()
                        .build();
                HttpResponse<String> frankRes = httpClient.send(frankReq, HttpResponse.BodyHandlers.ofString());
                if (frankRes.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(frankRes.body());
                    if (root.path("rates").has("INR")) {
                        cnyToInr = root.path("rates").path("INR").asDouble();
                    }
                }
            } catch (Exception e) {
                log.warn("Secondary forex fetch failed: {}", e.getMessage());
            }
        }

        double effectiveCnyInr = cnyToInr != null ? cnyToInr : DEFAULT_CNY_INR.doubleValue();
        double effectiveUsdInr = usdToInr != null ? usdToInr : DEFAULT_USD_INR.doubleValue();

        // 2. Fetch Silver Futures (COMEX SI=F: USD per troy ounce)
        Double silverUsdOz = fetchYahooRegularMarketPrice("SI=F");

        // 3. Fetch Copper Futures (COMEX HG=F: USD per pound)
        Double copperUsdLb = fetchYahooRegularMarketPrice("HG=F");

        // Calculations
        BigDecimal exchangeRateBd = BigDecimal.valueOf(effectiveCnyInr).setScale(4, RoundingMode.HALF_UP);
        BigDecimal usdInrBd = BigDecimal.valueOf(effectiveUsdInr).setScale(2, RoundingMode.HALF_UP);

        BigDecimal silverRateBd;
        BigDecimal silverUsdOzBd = null;
        if (silverUsdOz != null && silverUsdOz > 0) {
            silverUsdOzBd = BigDecimal.valueOf(silverUsdOz).setScale(3, RoundingMode.HALF_UP);
            double silverInrKg = silverUsdOz * TROY_OZ_PER_KG * effectiveUsdInr;
            silverRateBd = BigDecimal.valueOf(silverInrKg).setScale(2, RoundingMode.HALF_UP);
        } else {
            silverRateBd = cachedRates != null ? cachedRates.getSilverRate() : DEFAULT_SILVER_INR_KG;
        }

        BigDecimal copperRateBd;
        BigDecimal copperUsdLbBd = null;
        if (copperUsdLb != null && copperUsdLb > 0) {
            copperUsdLbBd = BigDecimal.valueOf(copperUsdLb).setScale(4, RoundingMode.HALF_UP);
            double copperInrKg = copperUsdLb * LBS_PER_KG * effectiveUsdInr;
            copperRateBd = BigDecimal.valueOf(copperInrKg).setScale(2, RoundingMode.HALF_UP);
        } else {
            copperRateBd = cachedRates != null ? cachedRates.getCopperRate() : DEFAULT_COPPER_INR_KG;
        }

        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss"));

        return MarketRatesResponse.builder()
                .exchangeRate(exchangeRateBd)
                .silverRate(silverRateBd)
                .copperRate(copperRateBd)
                .usdInrRate(usdInrBd)
                .silverUsdOz(silverUsdOzBd)
                .copperUsdLb(copperUsdLbBd)
                .lastUpdated(timeStr)
                .status("LIVE")
                .build();
    }

    private Double fetchYahooRegularMarketPrice(String symbol) {
        try {
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol;
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(res.body());
                JsonNode results = root.path("chart").path("result");
                if (results.isArray() && !results.isEmpty()) {
                    JsonNode meta = results.get(0).path("meta");
                    if (meta.has("regularMarketPrice") && !meta.path("regularMarketPrice").isNull()) {
                        return meta.path("regularMarketPrice").asDouble();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed fetching market price for {}: {}", symbol, e.getMessage());
        }
        return null;
    }

    private MarketRatesResponse createFallbackResponse() {
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss"));
        return MarketRatesResponse.builder()
                .exchangeRate(DEFAULT_CNY_INR)
                .silverRate(DEFAULT_SILVER_INR_KG)
                .copperRate(DEFAULT_COPPER_INR_KG)
                .usdInrRate(DEFAULT_USD_INR)
                .lastUpdated(timeStr)
                .status("FALLBACK")
                .build();
    }
}

