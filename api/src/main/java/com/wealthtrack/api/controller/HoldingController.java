package com.wealthtrack.api.controller;

import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.repository.HoldingRepository;
import com.wealthtrack.api.service.OwnershipService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@RequiredArgsConstructor
public class HoldingController {

    private final HoldingRepository holdingRepository;
    private final OwnershipService ownershipService;

    @Data
    static class AddHoldingRequest {
        private String ticker;
        private String companyName;
        private BigDecimal shares;
        private BigDecimal avgCostBasis;
        private Long portfolioId;
    }

    @PostMapping
    public ResponseEntity<?> addHolding(@RequestBody AddHoldingRequest request, Authentication authentication) {
        if (request.getPortfolioId() == null
                || request.getTicker() == null || request.getTicker().isBlank()
                || request.getShares() == null || request.getShares().signum() <= 0
                || request.getAvgCostBasis() == null || request.getAvgCostBasis().signum() < 0) {
            return ResponseEntity.badRequest()
                    .body("portfolioId, ticker, a positive share count and a non-negative cost basis are required");
        }

        // Only allow adding to a portfolio the caller owns
        Portfolio portfolio = ownershipService.requireOwnedPortfolio(request.getPortfolioId(), authentication);

        Holding holding = new Holding();
        holding.setTicker(request.getTicker().trim().toUpperCase());
        String name = request.getCompanyName();
        holding.setCompanyName(name == null || name.isBlank() ? holding.getTicker() : name.trim());
        holding.setShares(request.getShares());
        holding.setAvgCostBasis(request.getAvgCostBasis());
        holding.setPortfolio(portfolio);
        holdingRepository.save(holding);

        return ResponseEntity.ok(holding);
    }

    @GetMapping("/portfolio/{portfolioId}")
    public List<Holding> getByPortfolio(@PathVariable Long portfolioId, Authentication authentication) {
        ownershipService.requireOwnedPortfolio(portfolioId, authentication);
        return holdingRepository.findByPortfolioId(portfolioId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHolding(@PathVariable Long id, Authentication authentication) {
        Holding holding = ownershipService.requireOwnedHolding(id, authentication);
        holdingRepository.delete(holding);
        return ResponseEntity.ok().body("Holding deleted");
    }
}
