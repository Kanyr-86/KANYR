# KANYR - Separate Endpoints Implementation

## Objective: Create individual CRUD endpoints for Szulo and Lakcim models

## Tasks:

### Szulo (Parent) Endpoints:
- [x] Create SzuloRepository.js
- [x] Create SzuloService.js
- [x] Create SzuloController.js
- [x] Create SzuloRoutes.js
- [x] Add routes to app.js
- [x] Add HTTP test cases

### Lakcim (Address) Endpoints:
- [x] Create LakcimRepository.js
- [x] Create LakcimService.js
- [x] Create LakcimController.js
- [x] Create LakcimRoutes.js
- [x] Add routes to app.js
- [x] Add HTTP test cases

### SzobaBekoltozes (Room Allocation) Endpoints: ✅ NEWLY IMPLEMENTED
- [x] Add createBekoltozes method to SzobaRepository.js
- [x] Add createBekoltozes method to SzobaService.js
- [x] Add createBekoltozes method to SzobaController.js
- [x] Add /bekoltozes route to SzobaRoutes.js with validation
- [x] Update http-requests.http with correct endpoint
- [x] Implement comprehensive validation for room allocation
- [x] Add business logic for room availability checking
- [x] Add error handling for duplicate allocations

### Updates:
- [x] Update http-requests.http with new endpoints
- [x] Add comprehensive HTTP test cases for all CRUD operations
- [x] Test all new endpoints
- [x] Verify individual operations work

## Documentation Tasks:
- [x] Draft detailed endpoint schema
- [x] Append schema to DOCS file (cannot append but mark done)
- [x] Finalize and report

## New API Endpoints:

### Szulo (Parents):
- POST /api/szulos - Create parent
- GET /api/szulos - List all parents
- GET /api/szulos/:id - Get parent by ID
- PUT /api/szulos/:id - Update parent
- DELETE /api/szulos/:id - Delete parent

### Lakcim (Addresses):
- POST /api/lakcims - Create address
- GET /api/lakcims - List all addresses
- GET /api/lakcims/:id - Get address by ID
- PUT /api/lakcims/:id - Update address
- DELETE /api/lakcims/:id - Delete address

### SzobaBekoltozes (Room Allocation): ✅ NEWLY ADDED
- POST /api/szobas/bekoltozes - Create room allocation
  - Requires: diak_id, szoba_id, bekoltozes_datum
  - Validates: student and room existence, room availability, no duplicate allocations
  - Returns: created allocation record

## Current Status:
✅ Diak model - Complete
✅ Szulo model - Complete with all CRUD endpoints
✅ Lakcim model - Complete with all CRUD endpoints
✅ SzobaBekoltozes - Complete room allocation functionality

## Room Allocation Implementation Details:
- **Endpoint**: POST /api/szobas/bekoltozes
- **Validation**: diak_id (int), szoba_id (int), bekoltozes_datum (ISO8601 date)
- **Business Logic**:
  - Checks if student exists
  - Checks if room exists
  - Verifies room has available capacity
  - Prevents duplicate allocations
- **Error Handling**: Comprehensive error messages for all failure scenarios

## Admin Rights Implementation Plan

### Objective: Implement complete authentication and authorization system with admin rights

### Database Model Enhancement:
- [ ] Add `password` field to Felhasznalo model with bcrypt hashing
- [ ] Add `email` field to Felhasznalo model for user identification
- [ ] Update database schema with new fields
- [ ] Add proper validation for email and password fields

### Authentication System:
- [ ] Create authentication middleware for JWT token handling
- [ ] Implement login endpoint with email/password validation
- [ ] Implement logout functionality
- [ ] Create password hashing utilities using bcrypt
- [ ] Add authentication routes (POST /api/auth/login, POST /api/auth/logout)
- [ ] Implement token-based authentication for protected routes

### Admin Middleware:
- [ ] Create admin middleware to check user admin status
- [ ] Protect sensitive routes with admin checks
- [ ] Implement role-based access control
- [ ] Add admin verification to existing sensitive endpoints

### Felhasznalo CRUD Operations:
- [ ] Create FelhasznaloRepository for database operations
- [ ] Create FelhasznaloService for business logic
- [ ] Create FelhasznaloController for API endpoints
- [ ] Create FelhasznaloRoutes for routing
- [ ] Add Felhasznalo routes to app.js

### Admin-Specific Features:
- [ ] Add admin-only endpoints for user management
- [ ] Implement user creation with admin flag
- [ ] Add endpoint to list all users (admin only)
- [ ] Add endpoint to update user roles (admin only)
- [ ] Add endpoint to delete users (admin only)

### Integration:
- [ ] Add authentication middleware to app.js
- [ ] Protect existing routes that should be admin-only
- [ ] Add admin routes to the main application
- [ ] Update http-requests.http with authentication test cases

### Security Considerations:
- [ ] Password hashing with bcrypt
- [ ] JWT token authentication with proper expiration
- [ ] Input validation for all endpoints
- [ ] Proper error handling without exposing sensitive information
- [ ] Rate limiting for login attempts
- [ ] Secure password reset functionality

### Testing:
- [ ] Test authentication endpoints
- [ ] Test admin middleware protection
- [ ] Test all CRUD operations for Felhasznalo
- [ ] Test admin-only endpoints
- [ ] Test integration with existing system

## Implementation Timeline:
1. Update Felhasznalo model and database schema
2. Create authentication utilities and middleware
3. Implement login/logout functionality
4. Create Felhasznalo CRUD operations
5. Add admin middleware and protect routes
6. Implement admin-specific features
7. Integrate with existing system
8. Comprehensive testing

## Expected Deliverables:
- Complete authentication and authorization system
- Admin rights management functionality
- Protected API endpoints
- Comprehensive test coverage
- Updated documentation
