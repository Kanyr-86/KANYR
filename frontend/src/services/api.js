import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Student API methods
export const getStudents = (params = {}) => api.get('/diaks', { params });
export const getStudentById = (id) => api.get(`/diaks/${id}`);
export const createStudent = (studentData) => api.post('/diaks', studentData);
export const updateStudent = (id, studentData) => api.put(`/diaks/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/diaks/${id}`);
export const enrollStudent = (enrollmentData) => api.post('/diaks/enroll', enrollmentData);
export const transferStudent = (id, transferData) => api.post(`/diaks/${id}/transfer`, transferData);
export const moveOutStudent = (id, moveOutData) => api.post(`/diaks/${id}/move-out`, moveOutData);
export const searchStudents = (params) => api.get('/diaks/search', { params });
export const getActiveStudents = () => api.get('/diaks/active');
export const getStudentStatistics = () => api.get('/diaks/statistics');
export const getStudentReport = (id) => api.get(`/diaks/${id}/report`);

// Room API methods
export const getRooms = (params = {}) => api.get('/szobas', { params });
export const getRoomById = (id) => api.get(`/szobas/${id}`);
export const createRoom = (roomData) => api.post('/szobas', roomData);
export const updateRoom = (id, roomData) => api.put(`/szobas/${id}`, roomData);
export const deleteRoom = (id) => api.delete(`/szobas/${id}`);
export const getRoomOccupancy = (id) => api.get(`/szobas/${id}/occupancy`);

// Parent API methods
export const getParents = (params = {}) => api.get('/szulos', { params });
export const getParentById = (id) => api.get(`/szulos/${id}`);
export const createParent = (parentData) => api.post('/szulos', parentData);
export const updateParent = (id, parentData) => api.put(`/szulos/${id}`, parentData);
export const deleteParent = (id) => api.delete(`/szulos/${id}`);

// Address API methods
export const getAddresses = (params = {}) => api.get('/lakcims', { params });
export const getAddressById = (id) => api.get(`/lakcims/${id}`);
export const createAddress = (addressData) => api.post('/lakcims', addressData);
export const updateAddress = (id, addressData) => api.put(`/lakcims/${id}`, addressData);
export const deleteAddress = (id) => api.delete(`/lakcims/${id}`);

// User API methods
export const getUsers = (params = {}) => api.get('/felhasznalos', { params });
export const getUserById = (id) => api.get(`/felhasznalos/${id}`);
export const createUser = (userData) => api.post('/felhasznalos', userData);
export const updateUser = (id, userData) => api.put(`/felhasznalos/${id}`, userData);
export const deleteUser = (id) => api.delete(`/felhasznalos/${id}`);

// Report API methods
export const getReports = (params = {}) => api.get('/reports', { params });
export const generateOccupancyReport = (params) => api.get('/reports/occupancy', { params });
export const generateStudentReport = (params) => api.get('/reports/students', { params });

export default api;
