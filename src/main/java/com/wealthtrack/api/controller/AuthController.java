package com.wealthtrack.api.controller;

import com.wealthtrack.api.dto.AuthResponse;
import com.wealthtrack.api.dto.LoginRequest;
import com.wealthtrack.api.dto.RegisterRequest;
import com.wealthtrack.api.model.User;
import com.wealthtrack.api.repository.UserRepository;
import com.wealthtrack.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFirstName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getFirstName()));
    }
}