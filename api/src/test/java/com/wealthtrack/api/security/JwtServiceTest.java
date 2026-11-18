package com.wealthtrack.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService serviceWithSecret(String secret) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", secret);
        return service;
    }

    @Test
    void refusesToStartWithoutSecret() {
        assertThatThrownBy(() -> serviceWithSecret("").validateSecret())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET is not set");
    }

    @Test
    void refusesShortSecret() {
        assertThatThrownBy(() -> serviceWithSecret("too-short").validateSecret())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void tokenRoundTrip() {
        JwtService service = serviceWithSecret("a-perfectly-fine-test-secret-of-32+-bytes");
        service.validateSecret();

        String token = service.generateToken("ralph@example.com");

        assertThat(service.isTokenValid(token)).isTrue();
        assertThat(service.extractEmail(token)).isEqualTo("ralph@example.com");
    }

    @Test
    void tokenSignedWithDifferentSecretIsInvalid() {
        JwtService issuer = serviceWithSecret("secret-number-one-that-is-long-enough!!");
        JwtService verifier = serviceWithSecret("secret-number-two-that-is-long-enough!!");

        String token = issuer.generateToken("ralph@example.com");

        assertThat(verifier.isTokenValid(token)).isFalse();
    }

    @Test
    void tamperedTokenIsInvalid() {
        JwtService service = serviceWithSecret("a-perfectly-fine-test-secret-of-32+-bytes");
        String token = service.generateToken("ralph@example.com");
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service.isTokenValid(tampered)).isFalse();
    }
}
