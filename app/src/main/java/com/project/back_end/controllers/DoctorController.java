package com.project.back_end.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.back_end.DTO.Login;
import com.project.back_end.models.Doctor;
import com.project.back_end.services.ClinicException;
import com.project.back_end.services.DoctorService;
import com.project.back_end.services.TokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;
    private final TokenService tokenService;

    public DoctorController(DoctorService doctorService, TokenService tokenService) {
        this.doctorService = doctorService;
        this.tokenService = tokenService;
    }

    @GetMapping
    public List<Doctor> getDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String time,
            @RequestParam(required = false) String specialty) {
        return doctorService.findDoctors(name, time, specialty);
    }

    @GetMapping("/{id}")
    public Doctor getDoctor(@PathVariable Long id) {
        return doctorService.findById(id);
    }

    @GetMapping("/{id}/availability")
    public Map<String, Object> getDoctorAvailability(
            @PathVariable Long id,
            @RequestParam LocalDate date) {
        return Map.of("doctorId", id, "date", date, "availableTimes", doctorService.availableTimes(id, date));
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody Login request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        Doctor doctor = doctorService.authenticate(request.getEmail(), request.getPassword());
        return Map.of("token", tokenService.generateToken(doctor.getEmail(), "doctor"), "role", "doctor");
    }

    @PostMapping
    public ResponseEntity<Doctor> createDoctor(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody Doctor doctor) {
        tokenService.authenticate(authorization, "admin");
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.create(doctor));
    }

    @PutMapping("/{id}")
    public Doctor updateDoctor(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody Doctor doctor) {
        tokenService.authenticate(authorization, "admin");
        return doctorService.update(id, doctor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        tokenService.authenticate(authorization, "admin");
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
