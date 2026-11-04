package com.project.back_end.repo;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.back_end.models.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
            Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdOrderByAppointmentTimeDesc(Long doctorId);

    List<Appointment> findByPatientIdAndStatusOrderByAppointmentTimeAsc(Long patientId, int status);

    List<Appointment> findByDoctorIdAndStatusOrderByAppointmentTimeAsc(Long doctorId, int status);

    boolean existsByDoctorIdAndAppointmentTime(Long doctorId, LocalDateTime appointmentTime);

    boolean existsByDoctorIdAndAppointmentTimeAndIdNot(Long doctorId, LocalDateTime appointmentTime, Long id);

    void deleteByDoctorId(Long doctorId);

    void deleteByPatientId(Long patientId);
}
