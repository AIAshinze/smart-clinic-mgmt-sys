CREATE DATABASE IF NOT EXISTS cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cms;
CREATE TABLE IF NOT EXISTS doctor (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_doctor_email (email)
);
CREATE TABLE IF NOT EXISTS doctor_available_times (
    doctor_id BIGINT NOT NULL,
    available_times VARCHAR(30) NOT NULL,
    PRIMARY KEY (doctor_id, available_times),
    CONSTRAINT fk_available_time_doctor FOREIGN KEY (doctor_id) REFERENCES doctor (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS patient (
    id BIGINT NOT NULL AUTO_INCREMENT,
    address VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_patient_email (email),
    UNIQUE KEY uk_patient_phone (phone)
);
CREATE TABLE IF NOT EXISTS admin (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_username (username)
);
CREATE TABLE IF NOT EXISTS appointment (
    id BIGINT NOT NULL AUTO_INCREMENT,
    appointment_time DATETIME(6) NOT NULL,
    status INT NOT NULL DEFAULT 0,
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_appointment_doctor_time (doctor_id, appointment_time),
    KEY idx_appointment_patient_time (patient_id, appointment_time),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor (id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient (id) ON DELETE RESTRICT,
    CONSTRAINT chk_appointment_status CHECK (status IN (0, 1))
);