package com.project.back_end.controllers;

import java.time.LocalDate;
import java.util.List;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.back_end.DTO.AppointmentDTO;
import com.project.back_end.DTO.AppointmentRequest;
import com.project.back_end.services.AppointmentService;
import com.project.back_end.services.TokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final TokenService tokenService;

    public AppointmentController(AppointmentService appointmentService, TokenService tokenService) {
        this.appointmentService = appointmentService;
        this.tokenService = tokenService;
    }

    @GetMapping("/mine")
    public List<AppointmentDTO> getMyAppointments(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        var claims = tokenService.authenticate(authorization, "patient");
        return appointmentService.findForPatient(claims.getSubject());
    }

    @GetMapping("/doctor")
    public List<AppointmentDTO> getDoctorAppointments(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) String patientName) {
        var claims = tokenService.authenticate(authorization, "doctor");
        return appointmentService.findForDoctor(
                claims.getSubject(), date == null ? LocalDate.now() : date, patientName);
    }

    @GetMapping
    public List<AppointmentDTO> getAllAppointments(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        tokenService.authenticate(authorization, "admin");
        return appointmentService.findAll();
    }

    @PostMapping
    public ResponseEntity<AppointmentDTO> bookAppointment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody AppointmentRequest appointment) {
        var claims = tokenService.authenticate(authorization, "patient");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.book(appointment, claims.getSubject()));
    }

    @PutMapping("/{id}")
    public AppointmentDTO updateAppointment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest appointment) {
        var claims = tokenService.authenticate(authorization, "patient");
        return appointmentService.update(id, appointment, claims.getSubject());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelAppointment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        var claims = tokenService.authenticate(authorization, "patient");
        appointmentService.cancel(id, claims.getSubject());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public AppointmentDTO completeAppointment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        var claims = tokenService.authenticate(authorization, "doctor");
        return appointmentService.complete(id, claims.getSubject());
    }
}
