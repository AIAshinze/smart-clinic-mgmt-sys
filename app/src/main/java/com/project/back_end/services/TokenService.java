package com.project.back_end.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import com.project.back_end.config.JwtProperties;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import javax.crypto.SecretKey;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class TokenService {
    private final SecretKey signingKey;

    public TokenService(JwtProperties properties) {
        String secret = properties.getSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String subject, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(8, ChronoUnit.HOURS)))
                .signWith(signingKey)
                .compact();
    }

    public Claims authenticate(String authorizationHeader, String expectedRole) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ClinicException(HttpStatus.UNAUTHORIZED, "A bearer token is required");
        }
        return authenticateToken(authorizationHeader.substring(7), expectedRole);
    }

    public Claims authenticateToken(String token, String expectedRole) {
        Claims claims;
        try {
            claims = Jwts.parser().verifyWith(signingKey).build()
                    .parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new ClinicException(HttpStatus.UNAUTHORIZED, "Token is invalid or expired");
        }
        if (expectedRole != null && !expectedRole.equals(claims.get("role", String.class))) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "This account does not have permission");
        }
        return claims;
    }

    public boolean validateToken(String token, String expectedRole) {
        try {
            authenticateToken(token, expectedRole);
            return true;
        } catch (ClinicException exception) {
            return false;
        }
    }
}
