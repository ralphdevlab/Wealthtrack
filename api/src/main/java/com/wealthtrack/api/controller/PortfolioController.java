package com.wealthtrack.api.controller;

import com.wealthtrack.api.dto.HoldingPerformance;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.repository.UserRepository;
import com.wealthtrack.api.service.AiInsightService;
import com.wealthtrack.api.service.PortfolioService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final PortfolioService portfolioService;
    private final AiInsightService aiInsightService;

    @Data
    static class CreatePortfolioRequest {
        private String name;
        private Long userId;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreatePortfolioRequest request) {
        User user = userRepository.findById(request.getUserId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Portfolio portfolio = new Portfolio();
        portfolio.setName(request.getName());
        portfolio.setUser(user);
        portfolioRepository.save(portfolio);

        return ResponseEntity.ok(portfolio);
    }

    @GetMapping("/user/{userId}")
    public List<Portfolio> getByUser(@PathVariable Long userId) {
        return portfolioRepository.findByUserId(userId);
    }

    @GetMapping("/{portfolioId}/performance")
    public List<HoldingPerformance> getPerformance(@PathVariable Long portfolioId) {
        return portfolioService.getPerformance(portfolioId);
    }
    
    @GetMapping("/{portfolioId}/insights")
    public Map<String, String> getInsights(@PathVariable Long portfolioId) {
        List<HoldingPerformance> performance = portfolioService.getPerformance(portfolioId);
        String insight = aiInsightService.generateInsight(performance);
        return Map.of("insight", insight);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyPortfolios(Authentication authentication) {
        String email = authentication.getName();  // comes from the JWT
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        List<Portfolio> portfolios = portfolioRepository.findByUserId(user.getId());
        return ResponseEntity.ok(portfolios);
    }
    
}