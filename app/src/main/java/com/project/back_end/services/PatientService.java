package com.project.back_end.services;

import com.project.back_end.models.Patient;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.PatientRepository;
import com.project.back_end.repo.PrescriptionRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public PatientService(
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            PrescriptionRepository prescriptionRepository,
            PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Patient register(Patient patient) {
        patient.setId(null);
        patient.setEmail(normalizeEmail(patient.getEmail()));
        if (patientRepository.existsByEmailIgnoreCase(patient.getEmail())) {
            throw new ClinicException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (patientRepository.existsByPhone(patient.getPhone())) {
            throw new ClinicException(HttpStatus.CONFLICT, "An account with this phone number already exists");
        }
        patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        return patientRepository.save(patient);
    }

    @Transactional(readOnly = true)
    public Patient authenticate(String email, String rawPassword) {
        Patient patient = patientRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(rawPassword, patient.getPassword())) {
            throw new ClinicException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return patient;
    }

    @Transactional(readOnly = true)
    public Patient findByEmail(String email) {
        return patientRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    @Transactional(readOnly = true)
    public Patient findById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    @Transactional(readOnly = true)
    public List<Patient> findAll() {
        return patientRepository.findAll();
    }

    @Transactional
    public Patient update(Long id, Patient changes) {
        Patient patient = findById(id);
        String email = normalizeEmail(changes.getEmail());
        if (patientRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ClinicException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (patientRepository.existsByPhoneAndIdNot(changes.getPhone(), id)) {
            throw new ClinicException(HttpStatus.CONFLICT, "An account with this phone number already exists");
        }
        patient.setName(changes.getName());
        patient.setEmail(email);
        patient.setPhone(changes.getPhone());
        patient.setAddress(changes.getAddress());
        if (changes.getPassword() != null && !changes.getPassword().isBlank()) {
            patient.setPassword(passwordEncoder.encode(changes.getPassword()));
        }
        return patientRepository.save(patient);
    }

    @Transactional
    public Patient updateProfile(String email, String name, String phone, String address) {
        Patient patient = findByEmail(email);
        if (patientRepository.existsByPhoneAndIdNot(phone, patient.getId())) {
            throw new ClinicException(HttpStatus.CONFLICT, "An account with this phone number already exists");
        }
        patient.setName(name);
        patient.setPhone(phone);
        patient.setAddress(address);
        return patientRepository.save(patient);
    }

    @Transactional
    public void delete(Long id) {
        Patient patient = findById(id);
        appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(id)
                .forEach(appointment -> prescriptionRepository.deleteByAppointmentId(appointment.getId()));
        appointmentRepository.deleteByPatientId(id);
        patientRepository.delete(patient);
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
