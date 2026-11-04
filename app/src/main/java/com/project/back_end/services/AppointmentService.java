package com.project.back_end.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.back_end.DTO.AppointmentDTO;
import com.project.back_end.DTO.AppointmentRequest;
import com.project.back_end.models.Appointment;
import com.project.back_end.models.Doctor;
import com.project.back_end.models.Patient;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.DoctorRepository;
import com.project.back_end.repo.PatientRepository;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    @Transactional
    public AppointmentDTO book(AppointmentRequest request, String patientEmail) {
        Patient patient = patientRepository.findByEmailIgnoreCase(patientEmail)
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Patient account no longer exists"));
        Doctor doctor = findDoctorId(request);
        validateBookingTime(doctor, request.getAppointmentTime(), null);

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setStatus(Appointment.SCHEDULED);
        return new AppointmentDTO(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentDTO update(Long id, AppointmentRequest request, String patientEmail) {
        Appointment appointment = findAppointment(id);
        requireOwner(appointment, patientEmail);
        if (appointment.getStatus() != Appointment.SCHEDULED) {
            throw new ClinicException(HttpStatus.CONFLICT, "Only scheduled appointments can be changed");
        }
        Doctor doctor = findDoctorId(request);
        validateBookingTime(doctor, request.getAppointmentTime(), id);
        appointment.setDoctor(doctor);
        appointment.setAppointmentTime(request.getAppointmentTime());
        return new AppointmentDTO(appointmentRepository.save(appointment));
    }

    @Transactional
    public void cancel(Long id, String patientEmail) {
        Appointment appointment = findAppointment(id);
        requireOwner(appointment, patientEmail);
        if (appointment.getStatus() != Appointment.SCHEDULED) {
            throw new ClinicException(HttpStatus.CONFLICT, "Only scheduled appointments can be cancelled");
        }
        appointmentRepository.delete(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findForPatient(String email) {
        Patient patient = patientRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Patient account no longer exists"));
        return appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(patient.getId())
                .stream().map(AppointmentDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findForDoctor(String email, LocalDate date, String patientName) {
        Doctor doctor = doctorRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Doctor account no longer exists"));
        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                        doctor.getId(), date.atStartOfDay(), date.plusDays(1).atStartOfDay().minusNanos(1));
        return appointments.stream()
                .filter(appointment -> patientName == null || patientName.isBlank()
                        || appointment.getPatient().getName().toLowerCase()
                                .contains(patientName.trim().toLowerCase()))
                .map(AppointmentDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findAll() {
        return appointmentRepository.findAll().stream().map(AppointmentDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public Appointment findAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Appointment not found"));
    }

    @Transactional(readOnly = true)
    public AppointmentDTO findDetails(Long id) {
        return new AppointmentDTO(findAppointment(id));
    }

    @Transactional
    public AppointmentDTO complete(Long id, String doctorEmail) {
        Appointment appointment = findAppointment(id);
        if (!appointment.getDoctor().getEmail().equalsIgnoreCase(doctorEmail)) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "You can only complete your own appointments");
        }
        appointment.setStatus(Appointment.COMPLETED);
        return new AppointmentDTO(appointmentRepository.save(appointment));
    }

    private Doctor findDoctorId(AppointmentRequest request) {
        if (request.getDoctorId() == null) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "A doctor is required");
        }
        return doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    private void validateBookingTime(Doctor doctor, LocalDateTime time, Long existingId) {
        if (time == null || !time.isAfter(LocalDateTime.now())) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "Appointment time must be in the future");
        }
        boolean availableSlot = doctor.getAvailableTimes().stream().anyMatch(slot -> {
            String[] parts = slot.split("-");
            return parts.length == 2 && time.toLocalTime().equals(java.time.LocalTime.parse(parts[0].trim()));
        });
        if (!availableSlot) {
            throw new ClinicException(HttpStatus.CONFLICT, "The selected time is not in the doctor's availability");
        }
        LocalDateTime start = time.minusHours(1);
        LocalDateTime end = time.plusHours(1);
        List<Appointment> nearby = appointmentRepository
                .findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                        doctor.getId(), start, end);
        boolean overlaps = nearby.stream()
                .filter(other -> existingId == null || !other.getId().equals(existingId))
                .anyMatch(other -> other.getAppointmentTime().isBefore(time.plusHours(1))
                        && other.getAppointmentTime().plusHours(1).isAfter(time));
        if (overlaps) {
            throw new ClinicException(HttpStatus.CONFLICT, "The selected appointment time is already booked");
        }
    }

    private static void requireOwner(Appointment appointment, String email) {
        if (!appointment.getPatient().getEmail().equalsIgnoreCase(email)) {
            throw new ClinicException(HttpStatus.FORBIDDEN, "You can only change your own appointments");
        }
    }
}
