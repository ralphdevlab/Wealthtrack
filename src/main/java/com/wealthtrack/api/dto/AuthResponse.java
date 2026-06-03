package com.wealthtrack.api.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String email;
    private String firstName;

    public AuthResponse(String token, String email, String firstName) {
        this.token = token;
        this.email = email;
        this.firstName = firstName;
    }
}