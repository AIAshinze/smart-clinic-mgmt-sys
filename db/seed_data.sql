USE cms;
-- Seed accounts use a deliberately non-login placeholder password.
-- Create real admin credentials with CLINIC_ADMIN_USERNAME and CLINIC_ADMIN_PASSWORD.
INSERT INTO doctor (id, email, name, password, phone, specialty)
VALUES (
        1,
        'doctor.lee@example.test',
        'Dr. Sarah Lee',
        'disabled-seed-account',
        '5551112222',
        'Cardiology'
    ),
    (
        2,
        'doctor.khan@example.test',
        'Dr. Amir Khan',
        'disabled-seed-account',
        '5552223333',
        'Family Medicine'
    ) ON DUPLICATE KEY
UPDATE name =
VALUES(name),
    specialty =
VALUES(specialty);
INSERT IGNORE INTO doctor_available_times (doctor_id, available_times)
VALUES (1, '09:00-10:00'),
    (1, '10:00-11:00'),
    (1, '14:00-15:00'),
    (2, '09:00-10:00'),
    (2, '13:00-14:00'),
    (2, '15:00-16:00');
INSERT INTO patient (id, address, email, name, password, phone)
VALUES (
        1,
        '10 Example Street',
        'patient.jones@example.test',
        'Alex Jones',
        'disabled-seed-account',
        '5553334444'
    ),
    (
        2,
        '20 Sample Avenue',
        'patient.park@example.test',
        'Morgan Park',
        'disabled-seed-account',
        '5554445555'
    ) ON DUPLICATE KEY
UPDATE name =
VALUES(name),
    address =
VALUES(address);
INSERT INTO appointment (
        id,
        appointment_time,
        status,
        doctor_id,
        patient_id
    )
VALUES (1, '2027-01-15 09:00:00', 0, 1, 1),
    (2, '2027-01-15 10:00:00', 0, 2, 2) ON DUPLICATE KEY
UPDATE appointment_time =
VALUES(appointment_time),
    status =
VALUES(status);