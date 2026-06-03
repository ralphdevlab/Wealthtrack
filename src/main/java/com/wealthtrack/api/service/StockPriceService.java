package com.wealthtrack.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class StockPriceService {

    @Value("${finnhub.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public BigDecimal getCurrentPrice(String ticker) {
        String url = "https://finnhub.io/api/v1/quote?symbol=" + ticker + "&token=" + apiKey;

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("c") != null) {
                // "c" is the current price field from Finnhub
                return new BigDecimal(response.get("c").toString());
            }
        } catch (Exception e) {
            System.out.println("Failed to fetch price for " + ticker + ": " + e.getMessage());
        }
        return BigDecimal.ZERO;
    }
}