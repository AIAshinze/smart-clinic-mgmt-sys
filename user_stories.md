## Admin User Stories

### 1. Admin Login
**Title:** As an admin, I want to log into the portal with my username and password, so that I can manage the platform securely.

**Acceptance Criteria:**
1. Valid credentials take the admin to the admin dashboard.
2. Invalid credentials show a generic error that doesn't reveal whether the username or password was wrong.
3. Repeated failed attempts temporarily lock the account and are logged.

**Priority:** High
**Story Points:** 3
**Notes:**
- Confirm the lockout threshold and duration with the security team.
- Passwords must be stored hashed, never in plain text.

### 2. Admin Logout
**Title:** As an admin, I want to log out of the portal, so that I can protect system access.

**Acceptance Criteria:**
1. Clicking logout ends the session and returns the admin to the login page.
2. After logout, using the browser back button does not display protected pages.
3. Sessions expire automatically after a period of inactivity.

**Priority:** High
**Story Points:** 1
**Notes:**
- The inactivity timeout duration still needs to be defined.

### 3. Add Doctor
**Title:** As an admin, I want to add doctors to the portal, so that they can manage their appointments and patients can book with them.

**Acceptance Criteria:**
1. The form requires name, email, specialization, and license number.
2. A duplicate email address or license number is rejected with a clear message.
3. The new doctor receives login credentials or an invitation and can log in.

**Priority:** High
**Story Points:** 5
**Notes:**
- Decide how credentials are delivered (email invitation or temporary password).

### 4. Delete Doctor Profile
**Title:** As an admin, I want to delete a doctor's profile from the portal, so that departed doctors no longer appear or have access.

**Acceptance Criteria:**
1. The admin must confirm before the deletion is completed.
2. The deleted doctor can no longer log in or appear in patient searches.
3. Existing appointments with that doctor are cancelled or reassigned, patients are notified, and the action is recorded in an audit log.

**Priority:** High
**Story Points:** 5
**Notes:**
- Decide between soft delete (archive) and hard delete. Soft delete is safer for records and audit history.

### 5. Run Appointments-per-Month Stored Procedure
**Title:** As an admin, I want to run a stored procedure in the MySQL CLI that returns the number of appointments per month, so that I can track usage statistics.

**Acceptance Criteria:**
1. Running the procedure returns one row per month with an appointment count, in chronological order.
2. An optional date range parameter limits the results.
3. Cancelled appointments are excluded from the counts, or a separate column reports them.

**Priority:** Medium
**Story Points:** 3
**Notes:**
- Confirm whether cancelled appointments should count toward usage.

---

## Patient User Stories

### 6. View Doctors Without Logging In
**Title:** As a patient, I want to view a list of doctors without logging in, so that I can explore my options before registering.

**Acceptance Criteria:**
1. The public list shows each doctor's name, specialization, and general availability.
2. No private data, such as contact details beyond the public profile, is visible without login.
3. The list can be filtered by specialization.

**Priority:** Medium
**Story Points:** 3
**Notes:**
- Booking actions should prompt the patient to sign up or log in.

### 7. Patient Sign Up
**Title:** As a patient, I want to sign up using my email and password, so that I can book appointments.

**Acceptance Criteria:**
1. The email must be valid and unique in the system.
2. The password must meet defined strength rules.
3. A verification email is sent, and booking is available once the account is verified.

**Priority:** High
**Story Points:** 5
**Notes:**
- Decide whether email verification is required before booking or can happen later.

### 8. Patient Login
**Title:** As a patient, I want to log into the portal to manage my bookings, so that I can see and change my appointments.

**Acceptance Criteria:**
1. Valid credentials take the patient to their dashboard.
2. Invalid credentials show a generic error message.
3. If the patient was trying to book before logging in, they are returned to that booking step after login.

**Priority:** High
**Story Points:** 2
**Notes:**
- Consider a "forgot password" flow as a follow-up story.

### 9. Patient Logout
**Title:** As a patient, I want to log out of the portal, so that I can secure my account.

**Acceptance Criteria:**
1. Logout ends the session and returns the patient to the public page.
2. Protected pages are not accessible via the back button after logout.
3. Sessions expire after a period of inactivity.

**Priority:** Medium
**Story Points:** 1
**Notes:**
- Shares session-handling logic with the admin logout story.

### 10. Book a One-Hour Appointment
**Title:** As a patient, I want to log in and book an hour-long appointment with a doctor, so that I can consult with them.

**Acceptance Criteria:**
1. Only the doctor's available slots are shown, and each slot is one hour long.
2. Once a slot is booked, it is immediately unavailable to other patients, which prevents double-booking.
3. A confirmation is shown and the appointment appears in the patient's upcoming appointments.

**Priority:** High
**Story Points:** 8
**Notes:**
- Concurrency control is needed so two patients cannot book the same slot at the same moment.
- Consider whether the patient can choose the appointment type or reason for visit.

### 11. View Upcoming Appointments
**Title:** As a patient, I want to view my upcoming appointments, so that I can prepare accordingly.

**Acceptance Criteria:**
1. Only future appointments are listed, sorted by date and time.
2. Each entry shows the doctor's name, specialization, date, time, and consultation details.
3. Past appointments are moved to a separate section or hidden by default.

**Priority:** Medium
**Story Points:** 3
**Notes:**
- Appointment reminders (email or SMS) could be a future story.

---

## Doctor User Stories

### 12. Doctor Login
**Title:** As a doctor, I want to log into the portal to manage my appointments, so that I can keep my schedule up to date.

**Acceptance Criteria:**
1. Valid credentials take the doctor to their dashboard.
2. Invalid credentials show a generic error message.
3. Deactivated or deleted doctor accounts cannot log in.

**Priority:** High
**Story Points:** 2
**Notes:**
- Shares authentication logic with the admin and patient login stories.

### 13. Doctor Logout
**Title:** As a doctor, I want to log out of the portal, so that I can protect my data.

**Acceptance Criteria:**
1. Logout ends the session and returns the doctor to the login page.
2. Protected pages are not accessible via the back button after logout.
3. Sessions expire after a period of inactivity.

**Priority:** Medium
**Story Points:** 1
**Notes:**
- Shares session-handling logic with the other logout stories.

### 14. View Appointment Calendar
**Title:** As a doctor, I want to view my appointment calendar, so that I can stay organized.

**Acceptance Criteria:**
1. The calendar supports at least day, week, and month views.
2. Booked appointments and unavailable blocks are clearly distinguished.
3. Selecting an appointment shows a summary without leaving the calendar.

**Priority:** High
**Story Points:** 5
**Notes:**
- Consider a timezone display if doctors or patients may be in different zones.

### 15. Mark Unavailability
**Title:** As a doctor, I want to mark my unavailability, so that patients only see the slots I am actually free.

**Acceptance Criteria:**
1. The doctor can block single or multiple time ranges, including full days.
2. Blocked times are removed from patient-facing availability immediately.
3. If an existing appointment falls in a newly blocked time, the doctor is warned, and the affected patient is notified to reschedule.

**Priority:** High
**Story Points:** 5
**Notes:**
- Recurring unavailability (for example, every Friday afternoon) may be a useful extension.

### 16. Update Profile
**Title:** As a doctor, I want to update my profile with my specialization and contact information, so that patients have up-to-date information.

**Acceptance Criteria:**
1. The doctor can edit specialization, phone number, email, and short bio.
2. Changes appear on the public doctor list after saving.
3. Email must remain valid and unique, and changes are recorded in an audit log.

**Priority:** Medium
**Story Points:** 3
**Notes:**
- Decide which fields the doctor can edit themselves and which require admin approval, such as the specialization or license.

### 17. View Patient Details for Upcoming Appointments
**Title:** As a doctor, I want to view the patient details for my upcoming appointments, so that I can be prepared.

**Acceptance Criteria:**
1. Each upcoming appointment shows the patient's name, age, contact details, and reason for visit.
2. The doctor can only view details for patients with an upcoming appointment with them.
3. Access to patient details is recorded in an audit log.

**Priority:** High
**Story Points:** 5
**Notes:**
- Share only the minimum information needed. Compliance requirements (such as HIPAA or local health data laws) should be confirmed before build.
