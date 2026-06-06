package com.wealthtrack.api.controller;

import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.HoldingRepository;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteMyAccount(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        // Cascade delete: holdings → portfolios → user
        List<Portfolio> portfolios = portfolioRepository.findByUserId(user.getId());
        for (Portfolio portfolio : portfolios) {
            holdingRepository.findByPortfolioId(portfolio.getId())
                    .forEach(holdingRepository::delete);
            portfolioRepository.delete(portfolio);
        }
        userRepository.delete(user);

        return ResponseEntity.ok().body("Account deleted");
    }
}