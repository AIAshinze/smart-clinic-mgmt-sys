package com.project.back_end.services;

import com.project.back_end.models.Doctor;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.DoctorRepository;
import com.project.back_end.repo.PrescriptionRepository;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorService(
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            PrescriptionRepository prescriptionRepository,
            PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Doctor> findDoctors(String name, String period, String specialty) {
        List<Doctor> result;
        if (hasText(name) && hasText(specialty)) {
            result = doctorRepository.findByNameContainingIgnoreCaseAndSpecialtyIgnoreCase(
                    name.trim(), specialty.trim());
        } else if (hasText(name)) {
            result = doctorRepository.findByNameContainingIgnoreCase(name.trim());
        } else if (hasText(specialty)) {
            result = doctorRepository.findBySpecialtyIgnoreCase(specialty.trim());
        } else {
            result = doctorRepository.findAll();
        }

        if (!hasText(period)) {
            return result;
        }
        String normalizedPeriod = period.trim().toUpperCase(Locale.ROOT);
        if (!normalizedPeriod.equals("AM") && !normalizedPeriod.equals("PM")) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "Time filter must be AM or PM");
        }
        return result.stream()
                .filter(doctor -> doctor.getAvailableTimes().stream()
                        .anyMatch(slot -> isPeriod(slot, normalizedPeriod)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Doctor findById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    @Transactional(readOnly = true)
    public Doctor authenticate(String email, String rawPassword) {
        Doctor doctor = doctorRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(rawPassword, doctor.getPassword())) {
            throw new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return doctor;
    }

    @Transactional
    public Doctor create(Doctor doctor) {
        doctor.setId(null);
        if (!hasText(doctor.getPassword())) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "A password is required for a new doctor");
        }
        doctor.setEmail(normalizeEmail(doctor.getEmail()));
        if (doctorRepository.existsByEmailIgnoreCase(doctor.getEmail())) {
            throw new ClinicException(HttpStatus.CONFLICT, "A doctor with this email already exists");
        }
        doctor.setAvailableTimes(validateTimeSlots(doctor.getAvailableTimes()));
        doctor.setPassword(passwordEncoder.encode(doctor.getPassword()));
        return doctorRepository.save(doctor);
    }

    @Transactional
    public Doctor update(Long id, Doctor changes) {
        Doctor existing = findById(id);
        String email = normalizeEmail(changes.getEmail());
        doctorRepository.findByEmailIgnoreCase(email)
                .filter(found -> !found.getId().equals(id))
                .ifPresent(found -> {
                    throw new ClinicException(HttpStatus.CONFLICT, "A doctor with this email already exists");
                });
        existing.setName(changes.getName());
        existing.setEmail(email);
        existing.setSpecialty(changes.getSpecialty());
        existing.setPhone(changes.getPhone());
        existing.setAvailableTimes(validateTimeSlots(changes.getAvailableTimes()));
        if (hasText(changes.getPassword())) {
            existing.setPassword(passwordEncoder.encode(changes.getPassword()));
        }
        return doctorRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Doctor doctor = findById(id);
        appointmentRepository.findByDoctorIdOrderByAppointmentTimeDesc(id)
                .forEach(appointment -> prescriptionRepository.deleteByAppointmentId(appointment.getId()));
        appointmentRepository.deleteByDoctorId(id);
        doctorRepository.delete(doctor);
    }

    @Transactional(readOnly = true)
    public List<String> availableTimes(Long doctorId, java.time.LocalDate date) {
        Doctor doctor = findById(doctorId);
        var start = date.atStartOfDay();
        var end = date.plusDays(1).atStartOfDay().minusNanos(1);
        var booked = appointmentRepository
                .findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(doctorId, start, end)
                .stream()
                .map(appointment -> appointment.getAppointmentTime().toLocalTime())
                .toList();
        return doctor.getAvailableTimes().stream()
                .filter(slot -> {
                    LocalTime slotStart = LocalTime.parse(slot.split("-")[0].trim());
                    return !booked.contains(slotStart)
                            && (!date.equals(java.time.LocalDate.now()) || slotStart.isAfter(LocalTime.now()));
                })
                .toList();
    }

    private static List<String> validateTimeSlots(List<String> slots) {
        if (slots == null) {
            return new ArrayList<>();
        }
        List<String> normalized = new ArrayList<>();
        for (String slot : slots) {
            if (slot == null) {
                throw new ClinicException(HttpStatus.BAD_REQUEST, "Availability slots cannot be empty");
            }
            String[] parts = slot.trim().split("\\s*-\\s*", -1);
            if (parts.length != 2) {
                throw new ClinicException(HttpStatus.BAD_REQUEST, "Availability must use HH:mm-HH:mm format");
            }
            try {
                LocalTime from = LocalTime.parse(parts[0]);
                LocalTime to = LocalTime.parse(parts[1]);
                if (!to.equals(from.plusHours(1))) {
                    throw new ClinicException(HttpStatus.BAD_REQUEST, "Availability slots must be one hour long");
                }
                normalized.add(from + "-" + to);
            } catch (java.time.format.DateTimeParseException exception) {
                throw new ClinicException(HttpStatus.BAD_REQUEST, "Availability must use HH:mm-HH:mm format");
            }
        }
        return normalized.stream().distinct().toList();
    }

    private static boolean isPeriod(String slot, String period) {
        try {
            int hour = LocalTime.parse(slot.split("-")[0].trim()).getHour();
            return period.equals("AM") ? hour < 12 : hour >= 12;
        } catch (java.time.format.DateTimeParseException exception) {
            return false;
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
