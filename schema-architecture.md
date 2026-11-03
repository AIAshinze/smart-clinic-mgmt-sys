# Schema and Architecture

## 1. Architecture Summary

SmartCare uses a three-tier design. The presentation tier is a same-origin HTML, CSS, and JavaScript portal, with Thymeleaf views for the admin and doctor dashboards. The application tier is a Java 17 Spring Boot application: Spring MVC routes browser requests, REST controllers expose JSON APIs, and services apply validation, authentication, authorization, and workflow rules. The data tier uses MySQL for clinic accounts, doctor availability, and appointments through Spring Data JPA, and MongoDB for flexible prescription documents through Spring Data MongoDB. Keeping appointment ownership and scheduling in the relational database provides foreign-key integrity, while prescription documents can evolve independently.

## 2. Numbered Flow

1. A browser requests `/` and Spring Boot serves the static portal. Dashboard requests such as `/adminDashboard/{token}` and `/doctorDashboard/{token}` are handled by `DashboardController`; valid requests render the corresponding Thymeleaf template, while invalid tokens redirect to `/`.
2. The portal's JavaScript sends a same-origin HTTP request to an `/api/...` route. For protected operations it includes the signed JWT as a bearer credential in the Authorization header.
3. Spring MVC's request dispatcher routes the request to the matching REST controller: `AdminController`, `DoctorController`, `PatientController`, `AppointmentController`, or `PrescriptionController`. Controllers handle request/response mapping and route-specific access checks.
4. The controller delegates business work to a service. Services validate the operation, resolve the authenticated role and identity, enforce record ownership, and apply rules such as appointment availability and preventing overlapping bookings.
5. For relational data, a Spring Data JPA repository maps entities to MySQL tables. For prescription data, `PrescriptionRepository` uses Spring Data MongoDB to read and write the `prescriptions` collection. An `appointmentId` in a prescription refers to a MySQL appointment; it is an application-level reference, not a cross-database foreign key.
6. MySQL or MongoDB returns the result through its repository. Services may combine or transform the result into an API response.
7. Spring serializes REST results as JSON and returns an HTTP status to the browser. The portal updates its view from the response; failures are returned as errors for the client to display. Thymeleaf dashboard routes instead return a rendered HTML view or a redirect.

## 3. MySQL Database Design

The database is named `cms`. The table names and column definitions below follow `db/schema.sql`; JPA entities map to the same tables. `PK` means primary key and `FK` means foreign key.

### `patient`

| Column | MySQL type | Keys and constraints |
|---|---|---|
| `id` | `BIGINT` | PK, `NOT NULL`, `AUTO_INCREMENT` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` |
| `password` | `VARCHAR(255)` | `NOT NULL`; stores a BCrypt hash, never a plaintext password |
| `phone` | `VARCHAR(10)` | `NOT NULL`, `UNIQUE`; application validation requires 10 digits |
| `address` | `VARCHAR(255)` | `NOT NULL` |

### `doctor`

| Column | MySQL type | Keys and constraints |
|---|---|---|
| `id` | `BIGINT` | PK, `NOT NULL`, `AUTO_INCREMENT` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` |
| `password` | `VARCHAR(255)` | `NOT NULL`; stores a BCrypt hash |
| `phone` | `VARCHAR(10)` | `NOT NULL`; application validation requires 10 digits |
| `specialty` | `VARCHAR(50)` | `NOT NULL` |

### `doctor_available_times`

JPA models a doctor's availability as an element collection, stored separately so one doctor can have multiple available time slots without repeating doctor profile columns.

| Column | MySQL type | Keys and constraints |
|---|---|---|
| `doctor_id` | `BIGINT` | PK component, `NOT NULL`; FK to `doctor.id`, `ON DELETE CASCADE` |
| `available_times` | `VARCHAR(30)` | PK component, `NOT NULL` |

The composite primary key `(doctor_id, available_times)` prevents duplicate slots for a doctor.

### `appointment`

| Column | MySQL type | Keys and constraints |
|---|---|---|
| `id` | `BIGINT` | PK, `NOT NULL`, `AUTO_INCREMENT` |
| `appointment_time` | `DATETIME(6)` | `NOT NULL`; application validation requires a future time |
| `status` | `INT` | `NOT NULL`, default `0`; check constraint permits `0` (scheduled) or `1` (completed) |
| `doctor_id` | `BIGINT` | `NOT NULL`; FK to `doctor.id`, `ON DELETE RESTRICT` |
| `patient_id` | `BIGINT` | `NOT NULL`; FK to `patient.id`, `ON DELETE RESTRICT` |

Indexes on `(doctor_id, appointment_time)` and `(patient_id, appointment_time)` support schedule and patient-history lookups. The foreign keys prevent removing a doctor or patient while appointment records still reference them.

### `admin`

| Column | MySQL type | Keys and constraints |
|---|---|---|
| `id` | `BIGINT` | PK, `NOT NULL`, `AUTO_INCREMENT` |
| `username` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` |
| `password` | `VARCHAR(255)` | `NOT NULL`; stores a BCrypt hash |

The initial administrator can be bootstrapped from environment configuration; credentials are not included in the schema.

## 4. MongoDB Collection Design

### `prescriptions`

Spring Data MongoDB maps the `Prescription` model to the `prescriptions` collection. A document stores one prescription and includes the relational `appointmentId` as an application-level reference. MongoDB does not enforce a foreign key to MySQL. The current model fields are:

| Field | BSON type | Constraints / purpose |
|---|---|---|
| `_id` | `ObjectId` | MongoDB document identifier, mapped to the Java `String id` |
| `patientName` | `String` | Required; patient name associated with the prescription |
| `appointmentId` | `NumberLong` | Required; ID of the associated MySQL appointment |
| `medication` | `String` | Required; medication name |
| `dosage` | `String` | Required; dosage instructions |
| `doctorNotes` | `String` | Optional; doctor's notes |

An index on `appointmentId` is useful for appointment-based lookups. Since the service allows at most one prescription document per appointment, a unique index can enforce that invariant under concurrent requests as well as in application logic.

Example document (the `additionalInstructions` array illustrates a possible flexible extension; it is **not** currently a field in the Java `Prescription` model):

```json
{
  "_id": { "$oid": "672a9b15a34c1e0f8b123456" },
  "patientName": "Amara Okafor",
  "appointmentId": 1042,
  "medication": "Amoxicillin",
  "dosage": "500 mg, three times daily for 7 days",
  "doctorNotes": "Take with food. Complete the full course.",
  "additionalInstructions": [
    {
      "type": "follow_up",
      "message": "Contact the clinic if symptoms have not improved after 3 days."
    }
  ]
}
```

The current Java model persists the fields listed in its table above; the example's extension would require adding a corresponding model field before the application can reliably create and consume it.
