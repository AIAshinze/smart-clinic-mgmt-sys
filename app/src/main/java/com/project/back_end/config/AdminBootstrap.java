package com.project.back_end.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.project.back_end.models.Admin;
import com.project.back_end.repo.AdminRepository;

/**
 * Creates the first administrator from CLINIC_ADMIN_USERNAME /
 * CLINIC_ADMIN_PASSWORD if no admin with that username exists yet. Does nothing
 * when both are unset.
 */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminBootstrap(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            ClinicProperties properties) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        boolean noUsername = username == null || username.isBlank();
        boolean noPassword = password == null || password.isBlank();
        if (noUsername && noPassword) {
            return;
        }
        if (noUsername || noPassword) {
            throw new IllegalStateException("Set both CLINIC_ADMIN_USERNAME and CLINIC_ADMIN_PASSWORD");
        }
        String trimmed = username.trim();
        if (adminRepository.findByUsernameIgnoreCase(trimmed).isEmpty()) {
            adminRepository.save(new Admin(trimmed, passwordEncoder.encode(password)));
        }
    }
}
