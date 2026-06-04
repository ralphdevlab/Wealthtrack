package com.wealthtrack.api.service;

import com.wealthtrack.api.dto.HoldingPerformance;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AiInsightService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    public String generateInsight(List<HoldingPerformance> holdings) {
        if (holdings.isEmpty()) {
            return "Add some holdings to get personalized insights about your portfolio.";
        }

        // Build a summary of the portfolio to send to the AI
        StringBuilder portfolioSummary = new StringBuilder();
        double totalValue = holdings.stream()
                .mapToDouble(h -> h.getMarketValue().doubleValue())
                .sum();

        for (HoldingPerformance h : holdings) {
            double weight = (h.getMarketValue().doubleValue() / totalValue) * 100;
            portfolioSummary.append(String.format(
                "%s (%s): %.1f%% of portfolio, %.2f%% gain/loss. ",
                h.getTicker(), h.getCompanyName(), weight, h.getGainLossPercent().doubleValue()
            ));
        }

        String prompt = "You are a financial analyst. Based on this portfolio, give exactly 2 short, "
                + "specific insights (1 sentence each) about diversification, concentration risk, or performance. "
                + "Be direct and practical. Do not give buy/sell advice. Portfolio: " + portfolioSummary;

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                    Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 150,
                "temperature", 0.7
            );

            Map<String, Object> response = restClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("choices") != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            System.out.println("AI insight failed: " + e.getMessage());
            return "Unable to generate insights right now.";
        }

        return "No insights available.";
    }
}