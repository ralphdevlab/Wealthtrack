package com.wealthtrack.api.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "holdings")
@Data
@NoArgsConstructor
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ticker;   // e.g. "AAPL"

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private BigDecimal shares;

    @Column(nullable = false)
    private BigDecimal avgCostBasis;   // average price paid per share

    @ManyToOne
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;
}
