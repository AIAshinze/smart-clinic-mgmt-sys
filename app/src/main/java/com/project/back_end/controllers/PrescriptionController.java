package com.project.back_end.controllers;

import com.project.back_end.models.Prescription;
import com.project.back_end.services.AppointmentService;
import com.project.back_end.services.ClinicException;
import com.project.back_end.services.PrescriptionService;
import com.project.back_end.services.TokenService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {
    private final PrescriptionService prescriptionService;
    private final AppointmentService appointmentService;
    private final TokenService tokenService;

    public PrescriptionController(
            PrescriptionService prescriptionService,
            AppointmentService appointmentService,
            TokenService tokenService) {
        this.prescriptionService = prescriptionService;
        this.appointmentService = appointmentService;
        this.tokenService = tokenService;
    }

    @PostMapping
    public ResponseEntity<Prescription> createPrescription(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody Prescription prescription) {
        var claims = tokenService.authenticate(authorization, "doctor");
        var appointment = appointmentService.findDetails(prescription.getAppointmentId());
        requireAppointmentDoctor(appointment.getDoctorEmail(), claims.getSubject());
        prescription.setPatientName(appointment.getPatientName());
        Prescription saved = prescriptionService.save(prescription);
        appointmentService.complete(appointment.getId(), claims.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/mine")
    public List<Prescription> getMyPrescriptions(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        var claims = tokenService.authenticate(authorization, "patient");
        List<Long> appointmentIds = appointmentService.findForPatient(claims.getSubject()).stream()
                .map(com.project.back_end.DTO.AppointmentDTO::getId)
                .toList();
        return prescriptionService.findForAppointments(appointmentIds);
    }

    @GetMapping("/appointment/{appointmentId}")
    public Prescription getPrescription(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable Long appointmentId) {
        var claims = tokenService.authenticate(authorization, null);
        var appointment = appointmentService.findDetails(appointmentId);
        String role = claims.get("role", String.class);
        if ("doctor".equals(role)) {
            requireAppointmentDoctor(appointment.getDoctorEmail(), claims.getSubject());
        } else if ("patient".equals(role)) {
            requireAppointmentPatient(appointment.getPatientEmail(), claims.getSubject());
        } else if (!"admin".equals(role)) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "This account does not have permission");
        }
        return prescriptionService.findByAppointmentId(appointmentId);
    }

    @PutMapping("/{id}")
    public Prescription updatePrescription(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String id,
            @Valid @RequestBody Prescription changes) {
        var claims = tokenService.authenticate(authorization, "doctor");
        var appointment = appointmentService.findDetails(changes.getAppointmentId());
        requireAppointmentDoctor(appointment.getDoctorEmail(), claims.getSubject());
        return prescriptionService.update(id, changes, appointment.getPatientName(), appointment.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String id) {
        var claims = tokenService.authenticate(authorization, "doctor");
        Prescription prescription = prescriptionService.findById(id);
        var appointment = appointmentService.findDetails(prescription.getAppointmentId());
        requireAppointmentDoctor(appointment.getDoctorEmail(), claims.getSubject());
        prescriptionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static void requireAppointmentDoctor(String appointmentDoctor, String subject) {
        if (!appointmentDoctor.equalsIgnoreCase(subject)) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "You can only manage prescriptions for your appointments");
        }
    }

    private static void requireAppointmentPatient(String appointmentPatient, String subject) {
        if (!appointmentPatient.equalsIgnoreCase(subject)) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "You can only view your own prescriptions");
        }
    }
}
