package com.wealthtrack.api.controller;

import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.repository.HoldingRepository;
import com.wealthtrack.api.repository.PortfolioRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@RequiredArgsConstructor
public class HoldingController {

    private final HoldingRepository holdingRepository;
    private final PortfolioRepository portfolioRepository;

    @Data
    static class AddHoldingRequest {
        private String ticker;
        private String companyName;
        private BigDecimal shares;
        private BigDecimal avgCostBasis;
        private Long portfolioId;
    }

    @PostMapping
    public ResponseEntity<?> addHolding(@RequestBody AddHoldingRequest request) {
        Portfolio portfolio = portfolioRepository.findById(request.getPortfolioId()).orElse(null);
        if (portfolio == null) {
            return ResponseEntity.badRequest().body("Portfolio not found");
        }

        Holding holding = new Holding();
        holding.setTicker(request.getTicker().toUpperCase());
        holding.setCompanyName(request.getCompanyName());
        holding.setShares(request.getShares());
        holding.setAvgCostBasis(request.getAvgCostBasis());
        holding.setPortfolio(portfolio);
        holdingRepository.save(holding);

        return ResponseEntity.ok(holding);
    }

    @GetMapping("/portfolio/{portfolioId}")
    public List<Holding> getByPortfolio(@PathVariable Long portfolioId) {
        return holdingRepository.findByPortfolioId(portfolioId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHolding(@PathVariable Long id) {
        if (!holdingRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        holdingRepository.deleteById(id);
        return ResponseEntity.ok().body("Holding deleted");
    }
}