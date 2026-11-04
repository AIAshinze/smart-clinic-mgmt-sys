package com.project.back_end.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.project.back_end.models.Appointment;
import com.project.back_end.models.Prescription;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.PrescriptionRepository;

/**
 * Prescriptions live in MongoDB while appointments live in MySQL, so the two
 * stores cannot share one database transaction. The methods here keep them
 * consistent by ordering the writes and compensating the MongoDB side when the
 * MySQL side does not commit.
 */
@Service
public class PrescriptionService {

    private static final Logger logger = LoggerFactory.getLogger(PrescriptionService.class);

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Issues a prescription and marks its appointment completed as a single
     * unit of work. The MongoDB write happens first. If the MySQL update fails,
     * or the MySQL commit fails, the prescription is deleted again in
     * afterCompletion.
     */
    @Transactional
    public Prescription issue(Prescription prescription, String doctorEmail) {
        Appointment appointment = appointmentRepository.findById(prescription.getAppointmentId())
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (!appointment.getDoctor().getEmail().equalsIgnoreCase(doctorEmail)) {
            throw new ClinicException(HttpStatus.FORBIDDEN,
                    "You can only manage prescriptions for your appointments");
        }
        if (appointment.getStatus() != Appointment.SCHEDULED) {
            throw new ClinicException(HttpStatus.CONFLICT,
                    "Only scheduled appointments can receive a prescription");
        }
        if (prescriptionRepository.existsByAppointmentId(appointment.getId())) {
            throw new ClinicException(HttpStatus.CONFLICT, "A prescription already exists for this appointment");
        }

        prescription.setId(null);
        prescription.setPatientName(appointment.getPatient().getName());
        Prescription saved = prescriptionRepository.save(prescription);
        removeIfNotCommitted(saved.getId());

        appointment.setStatus(Appointment.COMPLETED);
        appointmentRepository.saveAndFlush(appointment);
        return saved;
    }

    @Transactional
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

    public Prescription findByAppointmentId(Long appointmentId) {
        return prescriptionRepository.findFirstByAppointmentId(appointmentId)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Prescription not found"));
    }

    public Prescription findById(String id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ClinicException(HttpStatus.NOT_FOUND, "Prescription not found"));
    }

    public void delete(String id) {
        prescriptionRepository.delete(findById(id));
    }

    public List<Prescription> findForAppointments(List<Long> appointmentIds) {
        return appointmentIds.stream()
                .flatMap(appointmentId -> prescriptionRepository.findByAppointmentId(appointmentId).stream())
                .toList();
    }

    /**
     * Removes prescriptions for appointments that were deleted in MySQL. The
     * MongoDB deletes run only after the MySQL transaction has committed, so a
     * MySQL failure leaves the prescriptions in place. A failed MongoDB delete
     * is logged for reconciliation; the leftover documents are unreachable
     * because reads go through live MySQL appointments.
     */
    @Transactional
    public void deleteForAppointmentsAfterCommit(List<Long> appointmentIds) {
        if (appointmentIds.isEmpty()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (Long appointmentId : appointmentIds) {
                    try {
                        prescriptionRepository.deleteByAppointmentId(appointmentId);
                    } catch (RuntimeException exception) {
                        logger.error("Prescriptions for deleted appointment {} need manual cleanup",
                                appointmentId, exception);
                    }
                }
            }
        });
    }

    private void removeIfNotCommitted(String prescriptionId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    try {
                        prescriptionRepository.deleteById(prescriptionId);
                    } catch (RuntimeException exception) {
                        logger.error("Could not remove prescription {} after rollback; manual cleanup needed",
                                prescriptionId, exception);
                    }
                }
            }
        });
    }
}
