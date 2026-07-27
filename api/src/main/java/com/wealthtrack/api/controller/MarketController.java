package com.wealthtrack.api.controller;

import com.wealthtrack.api.dto.StockSearchResult;
import com.wealthtrack.api.service.StockPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final StockPriceService stockPriceService;

    @GetMapping("/search")
    public List<StockSearchResult> search(@RequestParam("q") String query) {
        if (query == null || query.trim().length() < 1) {
            return Collections.emptyList();
        }
        return stockPriceService.searchSymbols(query.trim());
    }
}
