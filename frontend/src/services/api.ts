// frontend/src/services/api.ts
import axios from 'axios';
import type { LoginCredentials, RegisterCredentials } from '../types';

// Define Club types
export interface Club {
  _id: string;
  name: string;
  description: string;
  clubImage?: string;
  category?: string;
  createdAt: string;
}

export interface NewClub {
  name: string;
  description: string;
  category?: string;
  clubImage?: File; // Add this for file upload
}

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication functions
export const login = async (credentials: LoginCredentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Store user role for easy access
    if (response.data.user.role) {
      localStorage.setItem('userRole', response.data.user.role);
    }
  }
  return response.data;
};

export const register = async (credentials: RegisterCredentials) => {
  const response = await api.post('/auth/register', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Store user role for easy access
    if (response.data.user.role) {
      localStorage.setItem('userRole', response.data.user.role);
    }
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  return true;
};

// Club management functions
export const getAllClubs = async () => {
  const response = await api.get('/clubs');
  return response.data;
};

export const createClub = async (clubData: NewClub) => {
  const formData = new FormData();
  formData.append('name', clubData.name);
  formData.append('description', clubData.description);
  
  if (clubData.category) {
    formData.append('category', clubData.category);
  }
  
  if (clubData.clubImage) {
    formData.append('clubImage', clubData.clubImage);
  }
  
  const response = await api.post('/clubs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteClub = async (clubId: string) => {
  const response = await api.delete(`/clubs/${clubId}`);
  return response.data;
};

export default api;