package com.project.back_end.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.project.back_end.models.Prescription;

public interface PrescriptionRepository extends MongoRepository<Prescription, String> {

    List<Prescription> findByAppointmentId(Long appointmentId);

    Optional<Prescription> findFirstByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    void deleteByAppointmentId(Long appointmentId);
}
