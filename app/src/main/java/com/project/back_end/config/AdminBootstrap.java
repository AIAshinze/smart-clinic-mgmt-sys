package com.project.back_end.config;

import com.project.back_end.models.Admin;
import com.project.back_end.repo.AdminRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        this.username = properties.getBootstrapAdmin().getUsername();
        this.password = properties.getBootstrapAdmin().getPassword();
    }

    @Override
    public void run(String... args) {
        if (username.isBlank() && password.isBlank()) {
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Set both CLINIC_ADMIN_USERNAME and CLINIC_ADMIN_PASSWORD");
        }
        if (adminRepository.findByUsernameIgnoreCase(username.trim()).isEmpty()) {
            adminRepository.save(new Admin(username.trim(), passwordEncoder.encode(password)));
        }
    }
}
