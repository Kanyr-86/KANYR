# JWT Payload Encryption Security Fix

## Date
2026-03-12

## Problem
JWT tokens contained sensitive user information (userId, username, email, admin status) in plaintext within the payload. While JWTs are signed to prevent tampering, the payload is only base64-encoded (not encrypted), meaning anyone with access to the token can decode and read its contents.

### Example of the Security Issue
```javascript
// JWT payload was visible to anyone:
{
  "userId": 123,
  "username": "john_doe",
  "email": "john@example.com",
  "admin": true,
  "tokenVersion": 1,
  "iat": 1709827200
}
```

If a JWT token was intercepted or leaked, an attacker could:
- Identify user accounts and their privilege levels
- Gather email addresses for targeted attacks
- Determine which users have administrative access
- Use this information for social engineering attacks

## Solution Overview
Implemented AES-256-GCM encryption for JWT payload data. The sensitive user data is now encrypted before being included in the JWT token. The JWT payload now only contains:
- `data`: Encrypted sensitive information (userId, username, email, admin, tokenVersion)
- `iat`: Issued at timestamp (not sensitive, used for token age validation)

### Encrypted Token Structure
```javascript
// New encrypted JWT payload:
{
  "data": "base64(iv):base64(authTag):base64(ciphertext)",
  "iat": 1709827200
}
```

The `data` field contains:
- **IV (Initialization Vector)**: 16 bytes, unique per encryption
- **Auth Tag**: 16 bytes, provides authentication (GCM mode)
- **Ciphertext**: The encrypted JSON payload

## Implementation Details

### Encryption Algorithm: AES-256-GCM
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **Auth Tag**: 128 bits (16 bytes)
- **Features**:
  - Confidentiality: Data is encrypted
  - Authenticity: Auth tag prevents tampering
  - Integrity: Any modification invalidates the token

### Files Modified

#### `backend/utils/authUtils.js`
**Added Functions:**
- `encryptPayload(data)` - Encrypts sensitive payload using AES-256-GCM
- `decryptPayload(encryptedData)` - Decrypts payload and returns original data

**Modified Functions:**
- `generateTokenWithVersion(user)` - Now encrypts sensitive data before signing
  - Encrypts: userId, username, email, admin, tokenVersion
  - Stores in `data` field of JWT payload
  - Keeps `iat` in plaintext for JWT validation

- `verifyToken(token)` - Now decrypts payload after signature verification
  - Verifies JWT signature first
  - If `data` field exists (encrypted format), decrypts it
  - Returns merged decrypted data + timestamps
  - Maintains backward compatibility with legacy non-encrypted tokens

**Environment Variables:**
- `JWT_ENCRYPTION_KEY` - Must be exactly 64 hexadecimal characters (32 bytes)
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### `backend/.env.example`
Added documentation and placeholder for `JWT_ENCRYPTION_KEY` with instructions for generating a secure key.

#### `backend/.env`
Added `JWT_ENCRYPTION_KEY` for development environment.

## Security Benefits

### Before (Vulnerable)
```bash
# Anyone can decode the JWT payload
echo "eyJhbGciOiJIUzI1NiIs..." | base64 -d
# Result: {"userId":123,"username":"john","email":"john@example.com","admin":true,...}
```

### After (Secure)
```bash
# Decoding only shows encrypted data
echo "eyJhbGciOiJIUzI1NiIs..." | base64 -d
# Result: {"data":"a1b2c3...x9y0z","iat":1709827200}
# Without the encryption key, the data is unreadable
```

## Backward Compatibility

The implementation includes backward compatibility for legacy tokens:
- `verifyToken()` checks if the payload contains a `data` field
- If `data` exists: decrypts the encrypted payload
- If no `data` field: treats it as a legacy token and returns it directly
- Legacy tokens will naturally expire and be replaced by encrypted ones

## Configuration Requirements

### Required Environment Variable
```bash
# 64 hexadecimal characters (32 bytes)
JWT_ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

### Generation Command
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing Recommendations

### 1. Token Generation and Verification
```javascript
// Test that tokens are generated with encrypted payload
const token = generateTokenWithVersion(user);
const decoded = jwt.decode(token);
console.log(decoded.data); // Should be encrypted string, not plain object

// Test that verification decrypts correctly
const verified = verifyToken(token);
console.log(verified.userId); // Should be original userId
console.log(verified.email);  // Should be original email
```

### 2. Security Verification
```bash
# 1. Login and get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kanyr.hu","password":"Admin@123456"}'

# 2. Copy the token and decode it (should show encrypted data)
echo "<token>" | cut -d'.' -f2 | base64 -d 2>/dev/null

# 3. Verify it doesn't contain plaintext sensitive data
# Should NOT see: userId, username, email, admin fields in plaintext
```

### 3. Backward Compatibility
- Test with existing (legacy) tokens - should still work
- Verify new tokens have encrypted format
- Ensure both types work during transition period

### 4. Edge Cases
- Test with various user data (special characters, unicode, etc.)
- Test token expiration still works correctly
- Test that tampering with encrypted data fails verification

## Deployment Checklist

- [ ] Generate production `JWT_ENCRYPTION_KEY` (64 hex characters)
- [ ] Add `JWT_ENCRYPTION_KEY` to production environment variables
- [ ] Ensure `JWT_SECRET` is also properly set (different from encryption key)
- [ ] Test login/logout flow in staging environment
- [ ] Verify existing tokens still work (backward compatibility)
- [ ] Monitor logs for any decryption errors
- [ ] Update deployment documentation

---

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

---

# CSRF (Cross-Site Request Forgery) Protection

## Date
2026-03-12

## Problem
The application was vulnerable to CSRF attacks. If a logged-in user visited a malicious website, that site could make unauthorized state-changing requests (POST, PUT, DELETE) to the API on behalf of the user. Since the application uses JWT tokens stored in localStorage and `withCredentials: true`, attackers could exploit this to perform actions like:
- Creating/modifying/deleting student records
- Changing room assignments
- Modifying user profiles
- Any other state-changing operation

## Solution Overview
Implemented CSRF protection using the **double-submit cookie pattern**:
1. Server generates a cryptographically secure random CSRF token
2. Token is set as a cookie (accessible by JavaScript) and also returned in response headers
3. Client reads the cookie and sends the token in a custom header (`X-CSRF-Token`) for state-changing requests
4. Server validates that the header token matches the stored token

This prevents CSRF attacks because:
- Attackers cannot read the cookie (same-origin policy)
- Attackers cannot set custom headers on cross-origin requests (CORS preflight)
- Attackers cannot guess the random token

## Files Created

### `backend/middleware/csrfMiddleware.js`
New middleware module providing:
- `generateToken()` - Generates cryptographically secure random tokens
- `getClientId()` - Creates unique client identifier based on IP, User-Agent, and user ID
- `csrfTokenMiddleware` - Generates and sets CSRF token cookie for all requests
- `csrfProtectionMiddleware` - Validates CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
- `getCsrfToken` - Route handler to fetch a fresh CSRF token

**Key Features:**
- 32-byte cryptographically secure random tokens
- 24-hour token lifetime with automatic cleanup
- Constant-time token comparison to prevent timing attacks
- Skips validation for safe methods (GET, HEAD, OPTIONS)
- Skips validation for login endpoint (user not authenticated yet)
- Skips validation when user is not authenticated

## Files Modified

### `backend/app.js`
- Added `cookie-parser` middleware to parse cookies
- Added `csrfTokenMiddleware` globally to generate tokens for all requests
- Added `csrfProtectionMiddleware` before all API routes to validate tokens
- Updated CORS configuration to allow `X-CSRF-Token` header

### `backend/routes/authRoutes.js`
- Added CSRF middleware imports
- Added `GET /api/auth/csrf-token` endpoint for fetching fresh tokens

### `backend/package.json`
- Added `cookie-parser` dependency

### `frontend/src/services/api.js`
- Added CSRF token management functions:
  - `getCsrfTokenFromCookie()` - Reads token from cookie
  - `fetchCsrfToken()` - Fetches fresh token from server
  - `ensureCsrfToken()` - Ensures valid token is available
- Updated request interceptor to include CSRF token in headers for state-changing requests
- Updated response interceptor to handle CSRF errors (403 with CSRF error codes)
- Automatic page reload with toast notification on CSRF token expiration

## How It Works

### Request Flow
```
1. User loads page → Server generates CSRF token → Sets XSRF-TOKEN cookie
2. User makes POST/PUT/DELETE request:
   a. Frontend reads XSRF-TOKEN cookie
   b. Adds X-CSRF-Token header with token value
   c. Sends request with both JWT and CSRF tokens
3. Server validates:
   a. JWT token (authentication)
   b. CSRF token matches stored value (CSRF protection)
4. If CSRF token invalid/missing → 403 Forbidden error
```

### CSRF Error Handling
When a CSRF error occurs (token expired or invalid):
1. Frontend catches the 403 error with CSRF error code
2. Attempts to fetch a fresh CSRF token
3. Shows toast notification: "Biztonsági token lejárt. Az oldal újratöltése..."
4. Reloads the page after 2 seconds to get fresh tokens

## API Changes

### New Endpoint
- `GET /api/auth/csrf-token` - Returns a fresh CSRF token
  - Response: `{ success: true, data: { csrfToken: "..." } }`

### Headers
- **Request**: `X-CSRF-Token: <token-value>` (required for POST, PUT, DELETE, PATCH)
- **Response**: `X-CSRF-Token: <token-value>` (included in all responses)

### Error Responses
CSRF errors return 403 Forbidden with specific error codes:
- `CSRF_MISSING` - No CSRF token provided
- `CSRF_EXPIRED` - Token expired or not found in storage
- `CSRF_INVALID` - Token doesn't match stored value

## Testing Recommendations

### 1. Normal Operation
1. Log in to the application
2. Verify CSRF token cookie is set (`XSRF-TOKEN`)
3. Perform state-changing operations (create student, update room, etc.)
4. Verify all operations succeed

### 2. CSRF Token Validation
1. Open browser developer tools
2. Find a POST/PUT/DELETE request
3. Verify `X-CSRF-Token` header is present
4. Verify header value matches cookie value

### 3. CSRF Attack Simulation
1. Log in to the application
2. Open browser console on a different origin (or use curl)
3. Try to make a POST request without CSRF token:
   ```javascript
   fetch('http://localhost:3000/api/students', {
     method: 'POST',
     headers: { 'Authorization': 'Bearer <token>' },
     body: JSON.stringify({ nev: 'Test' })
   })
   ```
4. Should receive 403 Forbidden with "CSRF token hiányzik" error

### 4. Token Expiration
1. Log in and note the CSRF token
2. Wait for token to expire (24 hours) or manually clear server storage
3. Try to make a state-changing request
4. Should receive CSRF error and page should reload automatically

### 5. Regression Testing
- Ensure all existing functionality still works
- Test file uploads (if applicable)
- Test form submissions
- Test API calls from different browsers

## Security Considerations

### Token Storage
- Tokens are stored in-memory on the server (Map)
- In production, consider using Redis for distributed environments
- Tokens are tied to client IP + User-Agent + User ID for additional security

### Cookie Security
- `httpOnly: false` - Required so JavaScript can read the cookie
- `secure: true` in production - Only sent over HTTPS
- `sameSite: 'strict'` - Prevents cross-site cookie sending
- `maxAge: 24 hours` - Token lifetime

### Additional Protections
- Rate limiting already in place prevents brute-force token guessing
- CORS configuration restricts allowed origins
- JWT authentication required before CSRF validation
