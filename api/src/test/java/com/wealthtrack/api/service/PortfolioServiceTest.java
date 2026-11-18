package com.wealthtrack.api.service;

import com.wealthtrack.api.dto.HoldingPerformance;
import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.repository.HoldingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock HoldingRepository holdingRepository;
    @Mock StockPriceService stockPriceService;
    @InjectMocks PortfolioService portfolioService;

    @Test
    void computesMarketValueGainAndPercent() {
        when(holdingRepository.findByPortfolioId(1L)).thenReturn(List.of(holding("AAPL", "10", "150")));
        when(stockPriceService.getCurrentPrice("AAPL")).thenReturn(new BigDecimal("180"));

        HoldingPerformance p = portfolioService.getPerformance(1L).get(0);

        assertThat(p.getMarketValue()).isEqualByComparingTo("1800.00");
        assertThat(p.getTotalCost()).isEqualByComparingTo("1500.00");
        assertThat(p.getGainLoss()).isEqualByComparingTo("300.00");
        assertThat(p.getGainLossPercent()).isEqualByComparingTo("20.00");
    }

    @Test
    void handlesLosses() {
        when(holdingRepository.findByPortfolioId(1L)).thenReturn(List.of(holding("TSLA", "4", "250")));
        when(stockPriceService.getCurrentPrice("TSLA")).thenReturn(new BigDecimal("200"));

        HoldingPerformance p = portfolioService.getPerformance(1L).get(0);

        assertThat(p.getGainLoss()).isEqualByComparingTo("-200.00");
        assertThat(p.getGainLossPercent()).isEqualByComparingTo("-20.00");
    }

    @Test
    void zeroCostBasisDoesNotDivideByZero() {
        when(holdingRepository.findByPortfolioId(1L)).thenReturn(List.of(holding("GIFT", "5", "0")));
        when(stockPriceService.getCurrentPrice("GIFT")).thenReturn(new BigDecimal("10"));

        HoldingPerformance p = portfolioService.getPerformance(1L).get(0);

        assertThat(p.getGainLossPercent()).isEqualByComparingTo("0");
        assertThat(p.getGainLoss()).isEqualByComparingTo("50.00");
    }

    @Test
    void emptyPortfolioReturnsEmptyList() {
        when(holdingRepository.findByPortfolioId(2L)).thenReturn(List.of());
        assertThat(portfolioService.getPerformance(2L)).isEmpty();
    }

    private static Holding holding(String ticker, String shares, String cost) {
        Holding h = new Holding();
        h.setId(1L);
        h.setTicker(ticker);
        h.setCompanyName(ticker);
        h.setShares(new BigDecimal(shares));
        h.setAvgCostBasis(new BigDecimal(cost));
        return h;
    }
}
