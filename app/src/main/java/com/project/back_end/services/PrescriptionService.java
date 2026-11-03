package com.project.back_end.services;

import com.project.back_end.models.Prescription;
import com.project.back_end.repo.PrescriptionRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    public Prescription save(Prescription prescription) {
        if (prescriptionRepository.existsByAppointmentId(prescription.getAppointmentId())) {
            throw new ClinicException(HttpStatus.CONFLICT, "A prescription already exists for this appointment");
        }
        prescription.setId(null);
        return prescriptionRepository.save(prescription);
    }

    public Prescription findByAppointmentId(Long appointmentId) {
        return prescriptionRepository.findFirstByAppointmentId(appointmentId)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Prescription not found"));
    }

    public Prescription findById(String id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Prescription not found"));
    }

    public Prescription update(String id, Prescription changes, String patientName, Long appointmentId) {
        Prescription current = findById(id);
        if (!current.getAppointmentId().equals(appointmentId)) {
            throw new ClinicException(HttpStatus.BAD_REQUEST, "A prescription cannot be moved to another appointment");
        }
        current.setPatientName(patientName);
        current.setMedication(changes.getMedication());
        current.setDosage(changes.getDosage());
        current.setDoctorNotes(changes.getDoctorNotes());
        return prescriptionRepository.save(current);
    }

    public void delete(String id) {
        Prescription prescription = findById(id);
        prescriptionRepository.delete(prescription);
    }

    public List<Prescription> findForAppointments(List<Long> appointmentIds) {
        return appointmentIds.stream()
                .flatMap(appointmentId -> prescriptionRepository.findByAppointmentId(appointmentId).stream())
                .toList();
    }
}
