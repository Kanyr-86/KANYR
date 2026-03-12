# Query Result Caching Implementation

## Overview
This document describes the query result caching implementation for frequently accessed data in the KANYR application.

## Cache Service

**Location:** `backend/services/CacheService.js`

The CacheService provides an in-memory caching solution with TTL (Time To Live) support:

### TTL Configuration
- **Default TTL:** 5 minutes (300,000 ms)
- **Statistics TTL:** 2 minutes (120,000 ms) - for more volatile data
- **Lists TTL:** 10 minutes (600,000 ms) - for less volatile list data

### Cache Key Patterns
```javascript
ROOMS_LIST: 'rooms:list'
ROOMS_AVAILABLE: 'rooms:available'
ROOM_STATISTICS: 'rooms:statistics'
ROOM_OCCUPANCY: 'rooms:occupancy'
STUDENTS_LIST: 'students:list'
STUDENTS_STATISTICS: 'students:statistics'
PARENTS_LIST: 'parents:list'
USERS_LIST: 'users:list'
SINGLE_ROOM: 'rooms:single'
SINGLE_STUDENT: 'students:single'
SINGLE_PARENT: 'parents:single'
SINGLE_USER: 'users:single'
```

## Cached Endpoints by Service

### 1. SzobaService (Rooms)
**File:** `backend/services/SzobaService.js`

| Method | Endpoint | Cache Key | TTL |
|--------|----------|-----------|-----|
| `getSzobaById(id)` | GET /api/rooms/:id | `rooms:single:id={id}` | Default (5 min) |
| `getAllSzobas()` | GET /api/rooms | `rooms:list:...` | Lists (10 min) |
| `getRoomStatistics()` | GET /api/rooms/statistics | `rooms:statistics` | Statistics (2 min) |
| `getAvailableRooms()` | GET /api/rooms/available | `rooms:available:...` | Default (5 min) |
| `getRoomOccupancy(id)` | GET /api/rooms/:id/occupancy | `rooms:occupancy:id={id}` | Statistics (2 min) |
| `getStudentsInRoom(id)` | GET /api/rooms/:id/students | `rooms:students:id={id}` | Default (5 min) |

**Cache Invalidation:**
- `createSzoba()` → Invalidates `rooms:*`
- `updateSzoba(id)` → Invalidates `rooms:*` and specific room cache
- `deleteSzoba(id)` → Invalidates `rooms:*` and specific room cache
- `createBekoltozes()` → Invalidates `rooms:*` and statistics
- `createBulkBekoltozes()` → Invalidates `rooms:*` and statistics

### 2. DiakService (Students)
**File:** `backend/services/DiakService.js`

| Method | Endpoint | Cache Key | TTL |
|--------|----------|-----------|-----|
| `getStudentWithFullHistory(id)` | GET /api/diaks/:id | `students:single:id={id}` | Default (5 min) |
| `getDetailedStatistics()` | GET /api/diaks/statistics | `students:statistics` | Statistics (2 min) |
| `searchStudents()` | GET /api/diaks/search | `students:list:...` | Lists (10 min) |
| `generateStudentReport(id)` | GET /api/diaks/:id/report | `students:report:id={id}` | Lists (10 min) |
| `getStudentsInRoom(szoba_id)` | Internal | `students:in_room:szoba_id={id}` | Default (5 min) |

**Cache Invalidation:**
- `enrollStudent()` → Invalidates `students:*`, `rooms:*`, statistics
- `transferStudent()` → Invalidates `students:*`, `rooms:*`, statistics
- `moveOutStudent()` → Invalidates `students:*`, `rooms:*`, statistics
- `updateDiak(id)` → Invalidates `students:*`, `parents:*`, specific student

### 3. FelhasznaloService (Users)
**File:** `backend/services/FelhasznaloService.js`

| Method | Endpoint | Cache Key | TTL |
|--------|----------|-----------|-----|
| `getUserById(id)` | GET /api/users/:id | `users:single:id={id}` | Default (5 min) |
| `getAllUsers()` | GET /api/users | `users:list:...` | Lists (10 min) |

**Cache Invalidation:**
- `createUser()` → Invalidates `users:*`
- `updateUser(id)` → Invalidates `users:*`, specific user
- `deleteUser(id)` → Invalidates `users:*`, specific user
- `updatePassword(id)` → Invalidates `users:*`, specific user
- `resetPassword(id)` → Invalidates `users:*`, specific user
- `updateUserRole(id)` → Invalidates `users:*`, specific user
- `forceLogout(id)` → Invalidates `users:*`, specific user
- `flagSuspiciousActivity(id)` → Invalidates `users:*`, specific user

### 4. SzuloService (Parents)
**File:** `backend/services/SzuloService.js`

| Method | Endpoint | Cache Key | TTL |
|--------|----------|-----------|-----|
| `getAllSzulos()` | GET /api/parents | `parents:list:...` | Lists (10 min) |
| `getSzuloById(id)` | GET /api/parents/:id | `parents:single:id={id}:...` | Default (5 min) |

**Cache Invalidation:**
- `createSzulo()` → Invalidates `parents:*`
- `updateSzulo(id)` → Invalidates `parents:*`, specific parent
- `deleteSzulo(id)` → Invalidates `parents:*`, specific parent

### 5. LakcimService (Addresses) - NEWLY IMPLEMENTED
**File:** `backend/services/LakcimService.js`

| Method | Endpoint | Cache Key | TTL |
|--------|----------|-----------|-----|
| `getAllLakcims()` | GET /api/addresses | `addresses:list:...` | Lists (10 min) |
| `getLakcimById(id)` | GET /api/addresses/:id | `addresses:single:id={id}:...` | Default (5 min) |
| `getLakcimsByCity(varos)` | GET /api/addresses/city/:varos | `addresses:by_city:varos={varos}` | Default (5 min) |

**Cache Invalidation:**
- `createLakcim()` → Invalidates `addresses:*`
- `updateLakcim(id)` → Invalidates `addresses:*`
- `deleteLakcim(id)` → Invalidates `addresses:*`

## Cache Statistics and Monitoring

The CacheService provides a `getStatistics()` method for monitoring:

```javascript
{
  totalEntries: number,    // Total cached entries
  validEntries: number,    // Non-expired entries
  expiredEntries: number,  // Expired entries waiting for cleanup
  hitRate: number          // Cache hit rate percentage
}
```

## Best Practices Implemented

1. **Different TTL for Different Data Types:**
   - Statistics (2 min) - Changes frequently
   - Lists (10 min) - Relatively stable
   - Single items (5 min) - Moderate volatility

2. **Cache Invalidation on Write Operations:**
   - Every create/update/delete operation invalidates relevant caches
   - Specific entity caches are deleted immediately
   - List caches are invalidated by pattern

3. **Security Considerations:**
   - Authentication lookups (email/username) are NOT cached for security
   - Password-related operations bypass cache

4. **Filtered Queries:**
   - Highly variable filtered queries are NOT cached
   - Standard list queries with pagination ARE cached

## Frontend Caching

The frontend also implements caching via `useApiCache.js` composable:

```javascript
const { fetchData, invalidateCache, clearCache } = useApiCache()

// Usage
const data = await fetchData('cache-key', async () => {
  return await api.get('/endpoint')
}, { useCache: true })
```

**Frontend Cache TTL:** 5 minutes

## Performance Benefits

1. **Reduced Database Load:** Frequently accessed data is served from memory
2. **Faster Response Times:** Cached responses are instantaneous
3. **Better User Experience:** Dashboard statistics and lists load quickly
4. **Scalability:** Less database pressure during peak usage

## Usage Examples

### Basic Caching
```javascript
const cacheKey = cacheService.generateKey(cacheService.keyPatterns.ROOMS_LIST, {
  limit, offset, sort, order, prefix
});

return await cacheService.getOrCompute(cacheKey, async () => {
  return await repository.findAll(options);
}, cacheService.listsTTL);
```

### Cache Invalidation
```javascript
// After creating a room
cacheService.invalidateRoomCache();

// After updating a specific room
cacheService.invalidateRoomCache();
cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_ROOM, { id: roomId }));
```

### Getting Cache Statistics
```javascript
const stats = cacheService.getStatistics();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

## Files Modified/Created

1. **Created/Modified:** `backend/services/LakcimService.js` - Added caching implementation
2. **Existing:** `backend/services/CacheService.js` - Core caching service
3. **Existing:** `backend/services/SzobaService.js` - Room caching
4. **Existing:** `backend/services/DiakService.js` - Student caching
5. **Existing:** `backend/services/FelhasznaloService.js` - User caching
6. **Existing:** `backend/services/SzuloService.js` - Parent caching
7. **Existing:** `frontend/src/composables/useApiCache.js` - Frontend caching
