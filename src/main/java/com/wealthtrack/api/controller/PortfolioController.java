package com.wealthtrack.api.controller;

import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;

    // Request body for creating a portfolio
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
}