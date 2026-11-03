package com.project.back_end.controllers;

import com.project.back_end.DTO.Login;
import com.project.back_end.models.Admin;
import com.project.back_end.repo.AdminRepository;
import com.project.back_end.services.ClinicException;
import com.project.back_end.services.TokenService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AdminController(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody Login request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        Admin admin = adminRepository.findByUsernameIgnoreCase(request.getUsername().trim())
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        return Map.of("token", tokenService.generateToken(admin.getUsername(), "admin"), "role", "admin");
    }

    @GetMapping
    public List<Map<String, Object>> listAdmins(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        tokenService.authenticate(authorization, "admin");
        return adminRepository.findAll().stream()
                .map(admin -> Map.<String, Object>of("id", admin.getId(), "username", admin.getUsername()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAdmin(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody Admin admin) {
        tokenService.authenticate(authorization, "admin");
        if (adminRepository.findByUsernameIgnoreCase(admin.getUsername().trim()).isPresent()) {
            throw new ClinicException(HttpStatus.CONFLICT, "An admin with this username already exists");
        }
        admin.setId(null);
        admin.setUsername(admin.getUsername().trim());
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));
        Admin saved = adminRepository.save(admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", saved.getId(), "username", saved.getUsername()));
    }
}
