import axios from 'axios';

// Base URL for the API - adjust this according to your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (userData) => api.post('/register', userData),
};

// Events API
export const eventsAPI = {
  getAllEvents: () => api.get('/events'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  subscribeToEvent: (id) => api.post(`/events/${id}/subscribe`),
  unsubscribeFromEvent: (id) => api.delete(`/events/${id}/subscribe`),
};

// Media API
export const mediaAPI = {
  getEventMedia: (eventId) => api.get(`/events/${eventId}/media`),
  uploadMedia: (eventId, formData) => {
    return api.post(`/events/${eventId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteMedia: (eventId, mediaId) => api.delete(`/events/${eventId}/media/${mediaId}`),
};

// Witness API
export const witnessAPI = {
  contactWitnesses: (eventId, message) => 
    api.post(`/events/${eventId}/contact-witnesses`, { message }),
};

export default api;