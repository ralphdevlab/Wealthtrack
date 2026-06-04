package com.wealthtrack.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class HoldingPerformance {
    private long id;
    private String ticker;
    private String companyName;
    private BigDecimal shares;
    private BigDecimal avgCostBasis;
    private BigDecimal currentPrice;
    private BigDecimal marketValue;     // shares * currentPrice
    private BigDecimal totalCost;        // shares * avgCostBasis
    private BigDecimal gainLoss;         // marketValue - totalCost
    private BigDecimal gainLossPercent;  // (gainLoss / totalCost) * 100
}