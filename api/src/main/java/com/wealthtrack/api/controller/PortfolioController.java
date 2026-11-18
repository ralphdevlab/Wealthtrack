package com.wealthtrack.api.controller;

import com.wealthtrack.api.dto.HoldingPerformance;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.service.AiInsightService;
import com.wealthtrack.api.service.OwnershipService;
import com.wealthtrack.api.service.PortfolioService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioService portfolioService;
    private final AiInsightService aiInsightService;
    private final OwnershipService ownershipService;

    @Data
    static class CreatePortfolioRequest {
        private String name;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreatePortfolioRequest request, Authentication authentication) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Portfolio name is required");
        }
        // Owner always comes from the JWT, never from the request body
        User user = ownershipService.currentUser(authentication);

        Portfolio portfolio = new Portfolio();
        portfolio.setName(request.getName().trim());
        portfolio.setUser(user);
        portfolioRepository.save(portfolio);

        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/me")
    public List<Portfolio> getMyPortfolios(Authentication authentication) {
        User user = ownershipService.currentUser(authentication);
        return portfolioRepository.findByUserId(user.getId());
    }

    @GetMapping("/{portfolioId}/performance")
    public List<HoldingPerformance> getPerformance(@PathVariable Long portfolioId, Authentication authentication) {
        ownershipService.requireOwnedPortfolio(portfolioId, authentication);
        return portfolioService.getPerformance(portfolioId);
    }

    @GetMapping("/{portfolioId}/insights")
    public Map<String, String> getInsights(@PathVariable Long portfolioId, Authentication authentication) {
        ownershipService.requireOwnedPortfolio(portfolioId, authentication);
        List<HoldingPerformance> performance = portfolioService.getPerformance(portfolioId);
        String insight = aiInsightService.generateInsight(performance);
        return Map.of("insight", insight);
    }
}
