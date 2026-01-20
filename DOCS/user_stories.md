# KANYR User Stories

## User Story 1: Student Room Assignment Management

**Title:** As a dormitory administrator, I want to manage student room assignments so that I can efficiently track occupancy and student information.

**Description:**
The KANYR system needs to handle the complete lifecycle of student room assignments in a dormitory, from initial registration through move-in, room changes, and move-out processes.

**Acceptance Criteria:**

### 1. Student Registration
- [ ] System must capture complete student personal information (name, email, phone, ID numbers)
- [ ] Must link each student to a parent/guardian with contact details
- [ ] Must store address information separately to avoid duplication
- [ ] All student data must be securely stored in the database

### 2. Room Management
- [ ] System must track all dormitory rooms with their capacity
- [ ] Must show current occupancy status for each room
- [ ] Must prevent over-booking of rooms beyond capacity

### 3. Room Assignment Process
- [ ] Must allow assigning students to specific rooms with move-in dates
- [ ] Must track move-out dates (NULL for current residents)
- [ ] Must maintain complete history of all room assignments
- [ ] Must validate that assignment dates don't conflict

### 4. Data Retrieval
- [ ] Must provide current room occupancy reports
- [ ] Must show student assignment history
- [ ] Must allow searching by student, room, or date range
- [ ] Must generate reports for administrative purposes

### 5. User Management
- [ ] Must support different user roles (admin vs regular users)
- [ ] Must enforce proper authentication and authorization
- [ ] Must log all administrative actions

**Technical Implementation:**
- Backend: Node.js with Sequelize ORM
- Database: SQLite with relational schema
- Frontend: To be determined (currently placeholder)
- API: RESTful endpoints for all CRUD operations

**Priority:** High
**Status:** In Progress
**Assigned:** Development Team
**Created:** 2026-01-20
**Last Updated:** 2026-01-20

---

## User Story 2: Student Information Management

**Title:** As a dormitory administrator, I want to manage comprehensive student information so that I can maintain accurate records and contact details.

**Description:**
The system should provide complete CRUD operations for student data including personal information, parent/guardian details, and address information.

**Acceptance Criteria:**
- [ ] Create new student records with all required fields
- [ ] Update existing student information
- [ ] View complete student profiles including assignment history
- [ ] Search and filter students by various criteria
- [ ] Maintain data integrity through proper validation

**Priority:** High
**Status:** Planned

---

## User Story 3: Room Occupancy Reporting

**Title:** As a dormitory administrator, I want to generate occupancy reports so that I can monitor room utilization and plan for future needs.

**Description:**
The system should provide reporting capabilities to show current and historical room occupancy data.

**Acceptance Criteria:**
- [ ] Generate current occupancy reports by room
- [ ] Show occupancy trends over time
- [ ] Export reports to common formats (CSV, PDF)
- [ ] Provide visual representations of occupancy data
- [ ] Allow filtering by date ranges and room types

**Priority:** Medium
**Status:** Planned
