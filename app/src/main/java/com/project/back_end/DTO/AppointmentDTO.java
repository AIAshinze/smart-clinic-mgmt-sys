package com.project.back_end.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.project.back_end.models.Appointment;

public class AppointmentDTO {

    private final Long id;
    private final Long doctorId;
    private final String doctorName;
    private final String doctorEmail;
    private final Long patientId;
    private final String patientName;
    private final String patientEmail;
    private final String patientPhone;
    private final String patientAddress;
    private final LocalDateTime appointmentTime;
    private final int status;

    public AppointmentDTO(Appointment appointment) {
        this.id = appointment.getId();
        this.doctorId = appointment.getDoctor().getId();
        this.doctorName = appointment.getDoctor().getName();
        this.doctorEmail = appointment.getDoctor().getEmail();
        this.patientId = appointment.getPatient().getId();
        this.patientName = appointment.getPatient().getName();
        this.patientEmail = appointment.getPatient().getEmail();
        this.patientPhone = appointment.getPatient().getPhone();
        this.patientAddress = appointment.getPatient().getAddress();
        this.appointmentTime = appointment.getAppointmentTime();
        this.status = appointment.getStatus();
    }

    public Long getId() {
        return id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public String getDoctorEmail() {
        return doctorEmail;
    }

    public Long getPatientId() {
        return patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public String getPatientEmail() {
        return patientEmail;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public String getPatientAddress() {
        return patientAddress;
    }

    public LocalDateTime getAppointmentTime() {
        return appointmentTime;
    }

    public int getStatus() {
        return status;
    }

    public LocalDate getAppointmentDate() {
        return appointmentTime.toLocalDate();
    }

    public LocalTime getAppointmentTimeOnly() {
        return appointmentTime.toLocalTime();
    }

    public LocalDateTime getEndTime() {
        return appointmentTime.plusHours(1);
    }
}
