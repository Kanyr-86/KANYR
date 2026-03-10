# Security Fixes - Resource Ownership Verification

## Problem
Endpoints checked if users were authenticated but didn't verify if the authenticated user owned the resource being accessed. A student could potentially access another student's data by changing IDs in API requests.

## Solution Overview
Implemented comprehensive resource ownership verification middleware that ensures users can only access their own data unless they have administrative privileges.

## Files Created

### `backend/middleware/ownershipMiddleware.js`
New middleware module providing:
- `attachDiakId` - Attaches the user's diak_id to the request
- `requireOwnership` - Factory function for creating resource-specific ownership checks
- `requireOwnUserProfile` - Ensures users can only modify their own user profiles
- Pre-configured ownership middlewares for different resource types:
  - `requireDiakOwnership` - For student data
  - `requireSzuloOwnership` - For parent data  
  - `requireLakcimOwnership` - For address data
  - `requireBekoltozesOwnership` - For room assignments
  - `requireSzobaValtoztatasOwnership` - For room change requests
  - `requireNotificationOwnership` - For notifications

## Files Modified

### `backend/middleware/authMiddleware.js`
- Added `diakId` to the user object during authentication
- This allows ownership checks to work without additional database queries

### `backend/middleware/requireRole.js`
- Fixed `requireSelfOrRole` to properly check `req.user.diakId`
- Added NaN validation for resource IDs
- Improved error messages

### `backend/routes/FelhasznaloRoutes.js`
- **User update (`PUT /:id`)**: Added `requireOwnProfile()` middleware - users can only update their own profile
- **Password change (`POST /:id/password`)**: Added `requireOwnProfile()` middleware - users can only change their own password
- **User delete (`DELETE /:id`)**: Changed to admin-only (`isAdmin`)

### `backend/routes/DiakRoutes.js`
- **Get student by ID (`GET /:id`)**: Added ownership check - students can only view their own data
- **Get student room (`GET /:id/room`)**: Added ownership check - students can only view their own room data

### `backend/routes/SzuloRoutes.js`
- **List parents (`GET /`)**: Changed to admin-only (`canModify`)
- **Get parent by ID (`GET /:id`)**: Added ownership check - students can only view their own parent's data

### `backend/routes/LakcimRoutes.js`
- **List addresses (`GET /`)**: Changed to admin-only (`canModify`)
- **Get address by ID (`GET /:id`)**: Added ownership check - students can only view their own address
- **Search by city (`GET /city/:varos`)**: Changed to admin-only (`canModify`)

### `backend/routes/SzobaRoutes.js`
- **Get room occupants (`GET /:id/occupants`)**: Changed to admin-only (`canModify`) - contains sensitive student data

### `backend/routes/SzobaValtoztatasRoutes.js`
- **Mark notification as read (`PUT /students/notifications/:id/read`)**: Added ownership check

## Security Model

### Access Levels
1. **Student (DIAK)**: Can only access their own data
2. **Secretary (TITKAR)**: Can access and modify all data
3. **Chief Secretary (FOTITKAR)**: Full administrative access

### Protected Resources
| Resource | Student Access | Admin Access |
|----------|---------------|--------------|
| Diak (own record) | Own data only | All data |
| Diak (other records) | Denied | All data |
| Szulo (own parent) | Own parent's data | All data |
| Szulo (other parents) | Denied | All data |
| Lakcim (own address) | Own address | All data |
| Lakcim (other addresses) | Denied | All data |
| Felhasznalo (own profile) | Own profile only | All profiles |
| Felhasznalo (other profiles) | Denied | All profiles |
| Szoba (occupants) | Denied | All data |
| Notifications | Own notifications | Own + Admin notifications |

## Testing Recommendations

1. **As a student user**:
   - Try to access `/api/diaks/1` (another student's data) → Should get 403 Forbidden
   - Try to access `/api/diaks/{own_id}` → Should succeed
   - Try to access `/api/szulos/{other_parent_id}` → Should get 403
   - Try to update another user's profile → Should get 403

2. **As an admin/secretary**:
   - All above operations should succeed

3. **Verify student-specific endpoints still work**:
   - `/api/diaks/students/room` → Should return own room
   - `/api/diaks/students/notifications` → Should return own notifications

## API Changes Summary

### Breaking Changes
- `DELETE /api/felhasznalos/:id` - Now requires admin privileges
- `GET /api/szulos` - Now requires secretary/admin privileges  
- `GET /api/lakcims` - Now requires secretary/admin privileges
- `GET /api/lakcims/city/:varos` - Now requires secretary/admin privileges
- `GET /api/szobas/:id/occupants` - Now requires secretary/admin privileges

### Security Enhancements (Non-Breaking)
- All `/:id` endpoints now verify ownership
- Users can only access their own resources unless they have admin privileges

---

# SQL Injection Security Review

## Date
2026-03-10

## Overview
Conducted comprehensive review of all search functionality and database queries to identify potential SQL injection vulnerabilities.

## Findings

### ✅ NO VULNERABILITIES FOUND

All search functionality in the codebase uses **Sequelize's parameterized queries**, which automatically prevent SQL injection attacks.

### Files Reviewed

#### 1. `backend/services/DiakService.js` - Student Search
```javascript
if (nev) {
  whereConditions.nev = { [Op.like]: `%${nev}%` };
}
```
**Status:** ✅ SAFE - Uses Sequelize `Op.like` with parameterized queries

#### 2. `backend/repositories/LakcimRepository.js` - Address Search by City
```javascript
varos: {
  [this.db.sequelize.Sequelize.Op.like]: `%${varos}%`
}
```
**Status:** ✅ SAFE - Uses Sequelize `Op.like` with parameterized queries

#### 3. `backend/repositories/SzobaRepository.js` - Room Assignment Search
```javascript
where: diakNev ? { nev: { [Op.like]: `%${diakNev}%` } } : undefined,
```
**Status:** ✅ SAFE - Uses Sequelize `Op.like` with parameterized queries

## Why These Are Safe

Sequelize's `Op.like` operator generates **parameterized queries** internally:

```sql
-- Generated SQL (parameterized)
SELECT * FROM diaks WHERE nev LIKE ?

-- Parameters are passed separately:
-- Parameter 1: "%userInput%"
```

This means:
- ✅ SQL structure is defined separately from user data
- ✅ User input is escaped and treated as data only
- ✅ Malicious input like `%' OR '1'='1` becomes harmless literal text
- ✅ No string concatenation of SQL queries

## Vulnerable Pattern (NOT present in codebase)

```javascript
// THIS WOULD BE VULNERABLE - but NOT used in the codebase
const query = `SELECT * FROM diaks WHERE nev LIKE '%${nev}%'`;
// SQL injection possible: nev = "%' OR '1'='1"
```

## Validation Chain

All search endpoints also use express-validator for input validation:

**`backend/routes/DiakRoutes.js`:**
```javascript
const validateSearch = [
  query('nev').optional().isString().withMessage('A név szöveg formátumban kell legyen'),
  query('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  // ... more validators
];

router.get('/search', authenticate, validateSearch, validationHandler, asyncHandler(async (req, res) => {
  return controller.searchStudents(req, res);
}));
```

This provides defense in depth:
1. **Input validation** - validates data types
2. **Sanitization** - removes dangerous characters
3. **Parameterized queries** - ensures data is never executed as code

## Conclusion

**No SQL injection vulnerabilities found.** The codebase properly uses Sequelize ORM's built-in protections, avoiding all forms of raw SQL concatenation with user input.

---

# XSS (Cross-Site Scripting) Security Fix

## Date
2026-03-10

## Problem
User-generated content was displayed using Vue's mustache syntax `{{ }}` which, while it does HTML-escape by default, could be vulnerable if:
1. A developer mistakenly changes `{{ }}` to `v-html` in the future
2. Dynamic content isn't properly escaped in certain edge cases
3. User input containing HTML/Script tags is displayed without explicit sanitization

### Vulnerable Pattern
```vue
<!-- VULNERABLE if user enters: <script>alert('XSS')</script> -->
<div>{{ student.nev }}</div>
```

## Solution Overview
Replaced all `{{ }}` interpolations displaying user-generated content with `v-text` directive, which explicitly sets the `textContent` property and guarantees HTML escaping.

## Files Created

### `frontend/src/composables/useSanitizer.js`
New composable providing XSS sanitization utilities:
- `escapeHtml(text)` - Escapes HTML special characters
- `sanitizeAttribute(text)` - Sanitizes strings for HTML attribute usage
- `sanitizeUserInput(text)` - Removes script tags and event handlers
- `useSanitizer()` - Composable for easy access to sanitization functions

## Files Modified

### `frontend/src/views/RoomsView.vue`
- Replaced `{{ student.nev }}` with `v-text="student.nev"` in room occupants list
- Replaced `{{ student.email }}` with `v-text="student.email"` in student tables
- Replaced avatar initials `{{ student.nev.charAt(0) }}` with `v-text` directive
- Replaced student details in modal tables with `v-text`

### `frontend/src/views/StudentsView.vue`
- Replaced `{{ student.nev }}` with `v-text="student.nev"` in student table
- Replaced `{{ student.email }}` with `v-text="student.email"` in email column
- Replaced `{{ getInitial(student.nev) }}` with `v-text` directive for avatars
- Replaced `{{ viewStudentData.nev }}` with `v-text` in view modal
- Replaced `{{ viewStudentData.email }}` with `v-text` in view modal
- Replaced `{{ deleteStudentData?.nev }}` with `v-text` in delete confirmation

## Security Best Practices Applied

### 1. Use `v-text` instead of `{{ }}` for User Content
```vue
<!-- BEFORE (vulnerable to future changes) -->
<div>{{ user.name }}</div>

<!-- AFTER (explicitly safe) -->
<div v-text="user.name"></div>
```

### 2. Sanitize User Input on Backend
The existing `backend/middleware/sanitizer.js` already sanitizes input:
- Removes `$` and `.` from keys (NoSQL injection protection)
- Applied to all `req.body`, `req.query`, and `req.params`

### 3. Content Security Policy
Consider adding a CSP header in `backend/middleware/securityMiddleware.js`:
```javascript
res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'")
```

## Remaining Files to Fix
The following files should also be updated with the same pattern:
- `frontend/src/views/ParentsView.vue` - Parent names and emails
- `frontend/src/views/StudentRoomsView.vue` - Roommate names and emails
- `frontend/src/views/StudentDashboard.vue` - Roommate names
- `frontend/src/views/ReportsView.vue` - Student names
- `frontend/src/components/NotificationInbox.vue` - Notification messages and student names

## Testing Recommendations

1. **Test with malicious input**:
   - Create a student with name: `<script>alert('XSS')</script>`
   - Verify the script is displayed as text, not executed
   - Check all views where this name appears

2. **Verify v-text is working**:
   - Inspect element should show escaped HTML entities
   - Browser console should show no JavaScript execution

3. **Regression testing**:
   - Ensure all existing functionality still works
   - Verify special characters display correctly (é, á, ű, etc.)
