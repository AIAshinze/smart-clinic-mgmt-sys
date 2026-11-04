package com.project.back_end.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.back_end.DTO.Login;
import com.project.back_end.DTO.PatientProfileUpdate;
import com.project.back_end.models.Patient;
import com.project.back_end.services.PatientService;
import com.project.back_end.services.TokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;
    private final TokenService tokenService;

    public PatientController(PatientService patientService, TokenService tokenService) {
        this.patientService = patientService;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<Patient> register(@Valid @RequestBody Patient patient) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.register(patient));
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody Login request) {
        Patient patient = patientService.authenticate(request.getEmail(), request.getPassword());
        return Map.of("token", tokenService.generateToken(patient.getEmail(), "patient"), "role", "patient");
    }

    @GetMapping("/me")
    public Patient getProfile(@RequestHeader(name = "Authorization", required = false) String authorization) {
        var claims = tokenService.authenticate(authorization, "patient");
        return patientService.findByEmail(claims.getSubject());
    }

    @PatchMapping("/me")
    public Patient updateProfile(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody PatientProfileUpdate changes) {
        var claims = tokenService.authenticate(authorization, "patient");
        return patientService.updateProfile(
                claims.getSubject(), changes.getName(), changes.getPhone(), changes.getAddress());
    }

    @GetMapping
    public List<Patient> getPatients(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        tokenService.authenticate(authorization, "admin");
        return patientService.findAll();
    }

    @GetMapping("/{id}")
    public Patient getPatient(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        tokenService.authenticate(authorization, "admin");
        return patientService.findById(id);
    }

    @PutMapping("/{id}")
    public Patient updatePatient(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody Patient patient) {
        tokenService.authenticate(authorization, "admin");
        return patientService.update(id, patient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        tokenService.authenticate(authorization, "admin");
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
