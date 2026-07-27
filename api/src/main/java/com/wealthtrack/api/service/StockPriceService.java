package com.wealthtrack.api.service;

import com.wealthtrack.api.dto.StockSearchResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
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

    @SuppressWarnings("unchecked")
    public List<StockSearchResult> searchSymbols(String query) {
        List<StockSearchResult> results = new ArrayList<>();
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "https://finnhub.io/api/v1/search?q=" + encodedQuery + "&token=" + apiKey;

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("result") != null) {
                List<Map<String, Object>> matches = (List<Map<String, Object>>) response.get("result");
                for (Map<String, Object> match : matches) {
                    if (!"Common Stock".equals(match.get("type"))) {
                        continue;
                    }
                    StockSearchResult result = new StockSearchResult();
                    result.setSymbol((String) match.get("symbol"));
                    result.setDescription((String) match.get("description"));
                    results.add(result);
                    if (results.size() >= 10) {
                        break;
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Symbol search failed for " + query + ": " + e.getMessage());
        }
        return results;
    }
}