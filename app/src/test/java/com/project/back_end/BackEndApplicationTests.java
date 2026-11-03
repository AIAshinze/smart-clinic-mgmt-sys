package com.project.back_end;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.back_end.config.JwtProperties;
import com.project.back_end.models.Appointment;
import com.project.back_end.models.Doctor;
import com.project.back_end.services.ClinicException;
import com.project.back_end.services.TokenService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class BackEndApplicationTests {
    @Test
    void appointmentHelpersDeriveTheExpectedTimes() {
        Appointment appointment = new Appointment();
        LocalDateTime start = LocalDateTime.of(2027, 1, 15, 9, 0);
        appointment.setAppointmentTime(start);

        assertEquals(start.plusHours(1), appointment.getEndTime());
        assertEquals(start.toLocalDate(), appointment.getAppointmentDate());
        assertEquals(start.toLocalTime(), appointment.getAppointmentTimeOnly());
    }

    @Test
    void tokensAreTimeBoundAndRoleBound() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-longer-than-thirty-two-bytes");
        TokenService tokens = new TokenService(properties);

        String jwt = tokens.generateToken("doctor@example.test", "doctor");

        assertTrue(tokens.validateToken(jwt, "doctor"));
        assertFalse(tokens.validateToken(jwt, "admin"));
        assertThrows(ClinicException.class, () -> tokens.authenticateToken("not-a-token", "doctor"));
    }

    @Test
    void doctorPasswordIsNotSerialized() throws Exception {
        Doctor doctor = new Doctor();
        doctor.setPassword("NeverExposeMe123");

        String json = new ObjectMapper().writeValueAsString(doctor);

        assertFalse(json.contains("NeverExposeMe123"));
        assertTrue(json.contains("availableTimes"));
    }
}
