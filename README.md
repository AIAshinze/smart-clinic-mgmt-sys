# SmartCare Clinic Management System

SmartCare is a responsive clinic portal backed by a Spring Boot REST API. It uses MySQL for clinic accounts, availability, and appointments; MongoDB stores prescription documents. The browser client is vanilla HTML, CSS, and JavaScript and is served by Spring Boot.

## Roles, user stories, and access

| Role | User stories | Permissions and restrictions |
| --- | --- | --- |
| Admin | As an administrator, I can sign in, create other admin accounts, manage the doctor directory, inspect patient accounts, and review clinic appointments. | May create/read/update/delete doctors and patients, create/list admins, and read appointments. Cannot issue prescriptions or change another account's credentials through a public endpoint. |
| Doctor | As a doctor, I can sign in, see my daily appointments and patient details, and record treatment after a visit. | May view only assigned appointments and patient prescriptions, mark their own appointments complete by prescribing, and create/update/delete prescriptions for their own appointments. Cannot manage users, other doctors, or patient bookings. |
| Patient | As a patient, I can create an account, maintain my contact profile, find doctors, book/reschedule/cancel visits, and review my appointment and prescription history. | May access and update only their own profile and records. May change or cancel only their own scheduled appointments. Cannot view other patients or create prescriptions. |

Public doctor discovery exposes directory details only. Every protected API requires a short-lived JWT in the `Authorization: Bearer <token>` header. Passwords are stored with BCrypt and are write-only in JSON serialization. Role and ownership checks are enforced server-side; hiding controls in the browser is not considered authorization.

## Architecture and data

- **MySQL (`cms`)**: `admin`, `doctor`, `doctor_available_times`, `patient`, and `appointment` tables. Appointment rows have foreign keys and indexed doctor/patient time lookups.
- **MongoDB (`prescriptions`)**: flexible `prescriptions` documents reference a relational appointment by ID and store patient name, medication, dosage, and optional doctor notes.
- **Backend**: Java 17, Spring Boot 3, Spring Data JPA/MongoDB, Bean Validation, BCrypt, and signed JWTs.
- **Frontend**: responsive role-aware portal at `/`; the frontend calls same-origin `/api/...` endpoints.
- **Reporting**: `db/reports.sql` defines daily appointment and doctor-volume stored procedures.

## API

All routes are rooted at `/api`. Protected routes require a bearer token.

| Resource | Endpoints | Access |
| --- | --- | --- |
| Admin | `POST /admin`, `GET /admin`, `POST /admin/create` | Login is public; list/create require admin |
| Doctors | `GET /doctor`, `GET /doctor/{id}`, `GET /doctor/{id}/availability?date=YYYY-MM-DD`, `POST /doctor/login`, `POST /doctor`, `PUT /doctor/{id}`, `DELETE /doctor/{id}` | Discovery and login are public; mutations require admin |
| Patients | `POST /patient/register`, `POST /patient/login`, `GET/PATCH /patient/me`, `GET /patient`, `GET/PUT/DELETE /patient/{id}` | Register/login are public; self routes require patient; account administration requires admin |
| Appointments | `GET /appointment/mine`, `POST /appointment`, `PUT/DELETE /appointment/{id}`, `GET /appointment/doctor?date=YYYY-MM-DD`, `PATCH /appointment/{id}/complete`, `GET /appointment` | Patients manage their own visits; doctors see/complete their own; admin can list all |
| Prescriptions | `POST /prescription`, `GET /prescription/mine`, `GET /prescription/appointment/{appointmentId}`, `PUT/DELETE /prescription/{id}` | Doctors manage their own; patients read their own; admin may read |

Appointment requests use `{"doctorId": 1, "appointmentTime": "2027-01-15T09:00:00"}`. The server assigns the patient from the authenticated identity, checks the doctor's available slots, rejects past appointments and overlapping bookings, and does not trust a patient ID from the browser.

## Run locally

Requirements: Java 17, Docker Compose, and a configured `.env` file.

1. Copy `.env.example` to `.env` and replace every example value with unique local secrets. Do not commit `.env`.
2. Start the databases and application:

   ```powershell
   docker compose up --build
   ```

3. Open `http://localhost:8080`. The admin account is bootstrapped once from `CLINIC_ADMIN_USERNAME` and `CLINIC_ADMIN_PASSWORD`. Doctor and patient sample rows use disabled seed passwords; create real accounts through the portal or admin APIs.
4. Stop the stack with `docker compose down`. To preserve local data, keep the named volumes. Database initialization scripts only run on a fresh volume.

To run Spring Boot directly, start MySQL and MongoDB separately, set `MYSQL_URL`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MONGODB_URI`, and `JWT_SECRET`, then use `.\app\mvnw.cmd -f .\app\pom.xml spring-boot:run` from PowerShell. Set both admin bootstrap environment variables to create the first administrator. The local JWT fallback is development-only; always override it outside a local sandbox.

`db/schema.sql` and `db/seed_data.sql` are also suitable for manual MySQL initialization. Run `db/reports.sql` after the tables exist to install the reporting procedures. MongoDB sample data is in `db/seed_mongo.js`. Sample records contain no real patient information.

## Configuration and deployment

Configuration comes from environment variables: `MYSQL_URL`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MONGODB_URI`, `JWT_SECRET`, `CLINIC_ADMIN_USERNAME`, `CLINIC_ADMIN_PASSWORD`, and optionally `clinic.cors.allowed-origins`. The container image is built from `app/Dockerfile`; `docker-compose.yml` runs the application with MySQL and MongoDB. Production deployments should use a secret manager, TLS, a strong random JWT secret, restricted network access, and schema migrations rather than `ddl-auto=update`.

GitHub Actions runs `./mvnw -B -f app/pom.xml verify` for pushes to `main` and pull requests. The focused JUnit tests cover appointment helper values, JWT role/expiry validation, and password JSON redaction without requiring live databases.
