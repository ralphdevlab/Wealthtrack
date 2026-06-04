package com.wealthtrack.api.service;

import com.wealthtrack.api.dto.HoldingPerformance;
import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.repository.HoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final HoldingRepository holdingRepository;
    private final StockPriceService stockPriceService;

    public List<HoldingPerformance> getPerformance(Long portfolioId) {
        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        List<HoldingPerformance> results = new ArrayList<>();

        for (Holding holding : holdings) {
            BigDecimal currentPrice = stockPriceService.getCurrentPrice(holding.getTicker());

            BigDecimal marketValue = currentPrice.multiply(holding.getShares());
            BigDecimal totalCost = holding.getAvgCostBasis().multiply(holding.getShares());
            BigDecimal gainLoss = marketValue.subtract(totalCost);

            BigDecimal gainLossPercent = BigDecimal.ZERO;
            if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
                gainLossPercent = gainLoss
                        .divide(totalCost, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }

            HoldingPerformance perf = new HoldingPerformance();
            perf.setId(holding.getId());
            perf.setTicker(holding.getTicker());
            perf.setCompanyName(holding.getCompanyName());
            perf.setShares(holding.getShares());
            perf.setAvgCostBasis(holding.getAvgCostBasis());
            perf.setCurrentPrice(currentPrice);
            perf.setMarketValue(marketValue.setScale(2, RoundingMode.HALF_UP));
            perf.setTotalCost(totalCost.setScale(2, RoundingMode.HALF_UP));
            perf.setGainLoss(gainLoss.setScale(2, RoundingMode.HALF_UP));
            perf.setGainLossPercent(gainLossPercent.setScale(2, RoundingMode.HALF_UP));

            results.add(perf);
        }

        return results;
    }
}