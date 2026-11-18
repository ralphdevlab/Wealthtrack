package com.wealthtrack.api;

import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.HoldingRepository;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.repository.UserRepository;
import com.wealthtrack.api.security.JwtService;
import com.wealthtrack.api.service.AiInsightService;
import com.wealthtrack.api.service.StockPriceService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves that one user can never read, add to, or delete another user's data.
 * Alice owns a portfolio with one holding; Bob is a separate logged-in user.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OwnershipIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;
    @Autowired UserRepository userRepository;
    @Autowired PortfolioRepository portfolioRepository;
    @Autowired HoldingRepository holdingRepository;

    // External APIs are mocked so tests never call Finnhub or OpenAI
    @MockitoBean StockPriceService stockPriceService;
    @MockitoBean AiInsightService aiInsightService;

    String aliceToken;
    String bobToken;
    Portfolio alicePortfolio;
    Holding aliceHolding;

    @BeforeEach
    void setUp() {
        holdingRepository.deleteAll();
        portfolioRepository.deleteAll();
        userRepository.deleteAll();

        User alice = userRepository.save(user("alice@example.com", "Alice"));
        userRepository.save(user("bob@example.com", "Bob"));

        alicePortfolio = new Portfolio();
        alicePortfolio.setName("Alice Brokerage");
        alicePortfolio.setUser(alice);
        alicePortfolio = portfolioRepository.save(alicePortfolio);

        aliceHolding = new Holding();
        aliceHolding.setTicker("AAPL");
        aliceHolding.setCompanyName("Apple");
        aliceHolding.setShares(new BigDecimal("10"));
        aliceHolding.setAvgCostBasis(new BigDecimal("150"));
        aliceHolding.setPortfolio(alicePortfolio);
        aliceHolding = holdingRepository.save(aliceHolding);

        aliceToken = "Bearer " + jwtService.generateToken("alice@example.com");
        bobToken = "Bearer " + jwtService.generateToken("bob@example.com");

        when(stockPriceService.getCurrentPrice(anyString())).thenReturn(new BigDecimal("200"));
        when(aiInsightService.generateInsight(any())).thenReturn("Looks diversified enough.");
    }

    // ---- owner can use their own data ----

    @Test
    void ownerCanSeeOwnPerformance() throws Exception {
        mvc.perform(get("/api/portfolios/{id}/performance", alicePortfolio.getId())
                        .header("Authorization", aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ticker").value("AAPL"))
                .andExpect(jsonPath("$[0].gainLoss").value(500.00));
    }

    @Test
    void ownerCanDeleteOwnHolding() throws Exception {
        mvc.perform(delete("/api/holdings/{id}", aliceHolding.getId())
                        .header("Authorization", aliceToken))
                .andExpect(status().isOk());
        assertThat(holdingRepository.existsById(aliceHolding.getId())).isFalse();
    }

    @Test
    void myPortfoliosOnlyReturnsCallersPortfolios() throws Exception {
        mvc.perform(get("/api/portfolios/me").header("Authorization", bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ---- another user is blocked everywhere ----

    @Test
    void otherUserCannotSeePerformance() throws Exception {
        mvc.perform(get("/api/portfolios/{id}/performance", alicePortfolio.getId())
                        .header("Authorization", bobToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherUserCannotSeeInsights() throws Exception {
        mvc.perform(get("/api/portfolios/{id}/insights", alicePortfolio.getId())
                        .header("Authorization", bobToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherUserCannotListHoldings() throws Exception {
        mvc.perform(get("/api/holdings/portfolio/{id}", alicePortfolio.getId())
                        .header("Authorization", bobToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void otherUserCannotAddHoldingToSomeoneElsesPortfolio() throws Exception {
        String body = """
                {"ticker":"TSLA","companyName":"Tesla","shares":5,"avgCostBasis":100,"portfolioId":%d}
                """.formatted(alicePortfolio.getId());

        mvc.perform(post("/api/holdings")
                        .header("Authorization", bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());

        assertThat(holdingRepository.findByPortfolioId(alicePortfolio.getId())).hasSize(1);
    }

    @Test
    void otherUserCannotDeleteHolding() throws Exception {
        mvc.perform(delete("/api/holdings/{id}", aliceHolding.getId())
                        .header("Authorization", bobToken))
                .andExpect(status().isNotFound());
        assertThat(holdingRepository.existsById(aliceHolding.getId())).isTrue();
    }

    @Test
    void oldListByUserIdEndpointIsGone() throws Exception {
        mvc.perform(get("/api/portfolios/user/{id}", alicePortfolio.getUser().getId())
                        .header("Authorization", bobToken))
                .andExpect(status().isNotFound());
    }

    // ---- authentication itself ----

    @Test
    void requestWithoutTokenIsRejected() throws Exception {
        mvc.perform(get("/api/portfolios/{id}/performance", alicePortfolio.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    void tokenForgedWithTheOldHardcodedSecretIsRejected() throws Exception {
        String oldLeakedSecret = "wealthtrack-super-secret-key-that-is-long-enough-for-hs256-algorithm";
        String forged = Jwts.builder()
                .subject("alice@example.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(oldLeakedSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();

        mvc.perform(get("/api/portfolios/{id}/performance", alicePortfolio.getId())
                        .header("Authorization", "Bearer " + forged))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidHoldingInputIsRejected() throws Exception {
        String body = """
                {"ticker":"","shares":-1,"avgCostBasis":100,"portfolioId":%d}
                """.formatted(alicePortfolio.getId());

        mvc.perform(post("/api/holdings")
                        .header("Authorization", aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    private static User user(String email, String firstName) {
        User u = new User();
        u.setEmail(email);
        u.setPassword("$2a$10$notarealhashjustfortests000000000000000000000000000");
        u.setFirstName(firstName);
        u.setLastName("Test");
        return u;
    }
}
