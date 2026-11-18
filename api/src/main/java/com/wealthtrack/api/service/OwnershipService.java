package com.wealthtrack.api.service;

import com.wealthtrack.api.model.Holding;
import com.wealthtrack.api.model.Portfolio;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.HoldingRepository;
import com.wealthtrack.api.repository.PortfolioRepository;
import com.wealthtrack.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Central place for "does the logged-in user own this?" checks.
 *
 * Every endpoint that takes a portfolio or holding id goes through here, so a
 * user can never read or change data that belongs to someone else just by
 * guessing ids. Resources owned by another user return 404 (not 403) so the
 * API doesn't reveal which ids exist.
 */
@Service
@RequiredArgsConstructor
public class OwnershipService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;

    public User currentUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public Portfolio requireOwnedPortfolio(Long portfolioId, Authentication authentication) {
        User user = currentUser(authentication);
        return portfolioRepository.findById(portfolioId)
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));
    }

    public Holding requireOwnedHolding(Long holdingId, Authentication authentication) {
        User user = currentUser(authentication);
        return holdingRepository.findById(holdingId)
                .filter(h -> h.getPortfolio().getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Holding not found"));
    }
}
