package com.project.back_end.services;

import io.jsonwebtoken.Claims;

@org.springframework.stereotype.Service
public class Service {
    private final TokenService tokenService;

    public Service(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    public Claims requireRole(String authorizationHeader, String role) {
        return tokenService.authenticate(authorizationHeader, role);
    }

    public boolean validateToken(String token, String role) {
        return tokenService.validateToken(token, role);
    }
}
