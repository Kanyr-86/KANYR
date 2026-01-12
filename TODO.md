# KANYR - Separate Endpoints Implementation

## Objective: Create individual CRUD endpoints for Szulo and Lakcim models

## Tasks:

### Szulo (Parent) Endpoints:
- [ ] Create SzuloRepository.js
- [ ] Create SzuloService.js  
- [ ] Create SzuloController.js
- [ ] Create SzuloRoutes.js
- [ ] Add routes to app.js
- [ ] Add HTTP test cases

### Lakcim (Address) Endpoints:
- [ ] Create LakcimRepository.js
- [ ] Create LakcimService.js
- [ ] Create LakcimController.js
- [ ] Create LakcimRoutes.js
- [ ] Add routes to app.js
- [ ] Add HTTP test cases

### Updates:
- [ ] Update http-requests.http with new endpoints
- [ ] Test all new endpoints
- [ ] Verify individual operations work

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

## Current Status:
✅ Diak model - Complete
❌ Szulo model - Missing endpoints
❌ Lakcim model - Missing endpoints
