import axios from 'axios';

// Request deduplication cache
const requestCache = new Map();
const pendingRequests = new Map();

// Create axios instance with optimized defaults
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false
});

// Request interceptor for adding token and deduplication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Create cache key for deduplication
    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
    config._cacheKey = cacheKey;

    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    // Check cache for GET requests
    if (config.method === 'get' && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey);
      const now = Date.now();
      if (now - cached.timestamp < 30000) { // 30 second cache
        return Promise.resolve(cached.response);
      } else {
        requestCache.delete(cacheKey);
      }
    }

    // Store pending request
    const pendingRequest = axios(config);
    pendingRequests.set(cacheKey, pendingRequest);

    return pendingRequest.finally(() => {
      pendingRequests.delete(cacheKey);
    });
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method === 'get') {
      const cacheKey = response.config._cacheKey;
      requestCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Enhanced error handling wrapper
const handleApiError = (error) => {
  if (error.code === 'ERR_NETWORK') {
    return new Error('Hálózati hiba: Ellenőrizze az internetkapcsolatát');
  }
  if (error.code === 'ECONNABORTED') {
    return new Error('Kérés időtúllépés: A szerver nem válaszol');
  }
  if (error.response?.status >= 500) {
    return new Error('Szerver hiba: Próbálja meg később');
  }
  return error;
};

// Student API methods with enhanced error handling
export const getStudents = async (params = {}) => {
  try {
    const response = await api.get('/diaks', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getStudentById = async (id) => {
  try {
    const response = await api.get(`/diaks/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createStudent = async (studentData) => {
  try {
    const response = await api.post('/diaks', studentData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateStudent = async (id, studentData) => {
  try {
    const response = await api.put(`/diaks/${id}`, studentData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteStudent = async (id) => {
  try {
    const response = await api.delete(`/diaks/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const enrollStudent = async (enrollmentData) => {
  try {
    const response = await api.post('/diaks/enroll', enrollmentData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const transferStudent = async (id, transferData) => {
  try {
    const response = await api.post(`/diaks/${id}/transfer`, transferData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const moveOutStudent = async (id, moveOutData) => {
  try {
    const response = await api.post(`/diaks/${id}/move-out`, moveOutData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const searchStudents = async (params) => {
  try {
    const response = await api.get('/diaks/search', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getActiveStudents = async () => {
  try {
    const response = await api.get('/diaks/active');
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getStudentStatistics = async () => {
  try {
    const response = await api.get('/diaks/statistics');
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getStudentReport = async (id) => {
  try {
    const response = await api.get(`/diaks/${id}/report`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Room API methods
export const getRooms = async (params = {}) => {
  try {
    const response = await api.get('/szobas', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await api.get(`/szobas/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await api.post('/szobas', roomData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const response = await api.put(`/szobas/${id}`, roomData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await api.delete(`/szobas/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRoomOccupancy = async (id) => {
  try {
    const response = await api.get(`/szobas/${id}/occupancy`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Parent API methods
export const getParents = async (params = {}) => {
  try {
    const response = await api.get('/szulos', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getParentById = async (id) => {
  try {
    const response = await api.get(`/szulos/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createParent = async (parentData) => {
  try {
    const response = await api.post('/szulos', parentData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateParent = async (id, parentData) => {
  try {
    const response = await api.put(`/szulos/${id}`, parentData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteParent = async (id) => {
  try {
    const response = await api.delete(`/szulos/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Address API methods
export const getAddresses = async (params = {}) => {
  try {
    const response = await api.get('/lakcims', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getAddressById = async (id) => {
  try {
    const response = await api.get(`/lakcims/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createAddress = async (addressData) => {
  try {
    const response = await api.post('/lakcims', addressData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateAddress = async (id, addressData) => {
  try {
    const response = await api.put(`/lakcims/${id}`, addressData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteAddress = async (id) => {
  try {
    const response = await api.delete(`/lakcims/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// User API methods
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/felhasznalos', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/felhasznalos/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/felhasznalos', userData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/felhasznalos/${id}`, userData);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/felhasznalos/${id}`);
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Report API methods
export const getReports = async (params = {}) => {
  try {
    const response = await api.get('/reports', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const generateOccupancyReport = async (params) => {
  try {
    const response = await api.get('/reports/occupancy', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const generateStudentReport = async (params) => {
  try {
    const response = await api.get('/reports/students', { params });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Cache management utilities
export const clearApiCache = () => {
  requestCache.clear();
};

export const clearPendingRequests = () => {
  for (const [key, promise] of pendingRequests.entries()) {
    // Cancel pending requests if possible
    if (promise.cancel) {
      promise.cancel();
    }
  }
  pendingRequests.clear();
};

export default api;