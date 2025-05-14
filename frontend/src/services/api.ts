// frontend/src/services/api.ts
import axios from 'axios';
import type { LoginCredentials, RegisterCredentials } from '../types';

// Define Club types
export interface Club {
  _id: string;
  name: string;
  description: string;
  category?: string;
  clubImage?: string;
  createdAt: string;
  members?: string[]; // Array of user IDs or member objects
  isMember?: boolean; // For the current user
  memberCount?: number; // Number of members in the club
}

// Add interface for club members
export interface ClubMember {
  _id: string;
  name: string;
  email: string;
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

// Get public clubs (for unauthenticated access)
export const getPublicClubs = async () => {
  try {
    console.log('Fetching public clubs');
    // Using axios directly to avoid token being added by interceptor
    const response = await axios.get(`${API_URL}/clubs/public`);
    console.log('Public clubs response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching public clubs:', error);
    
    // Fallback to hardcoded clubs if API call fails
    const fallbackClubs = [
      { _id: '1', name: 'Sports Club' },
      { _id: '2', name: 'Art Club' },
      { _id: '3', name: 'Music Club' },
      { _id: '4', name: 'Tech Club' },
      { _id: '5', name: 'Science Club' }
    ];
    
    console.log('Returning fallback clubs');
    return fallbackClubs;
  }
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

// Join a club
export const joinClub = async (clubId: string) => {
  const response = await api.post(`/clubs/${clubId}/join`);
  return response.data;
};

// Leave a club
export const leaveClub = async (clubId: string) => {
  const response = await api.post(`/clubs/${clubId}/leave`);
  return response.data;
};

// Get club members - FRONTEND implementation (not backend)
export const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
  const response = await api.get(`/clubs/${clubId}/members`);
  return response.data;
};

// Event interfaces
export interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  eventType: string;
  start: string;
  end: string;
  club: string | Club;
  clubName: string;
  createdBy: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback: string;
  participants: string[];
  createdAt: string;
}

export interface NewEvent {
  title: string;
  description: string;
  location: string;
  eventType: string;
  start: string;
  end: string;
}

// Get all events (filtered by user role)
export const getEvents = async (): Promise<Event[]> => {
  const response = await api.get('/events');
  return response.data;
};

// Create new event (for club admins)
export const createEvent = async (eventData: NewEvent): Promise<Event> => {
  const response = await api.post('/events', eventData);
  return response.data;
};

// Update event status (for university admins)
export const updateEventStatus = async (
  eventId: string, 
  status: 'approved' | 'rejected', 
  feedback?: string
): Promise<Event> => {
  const response = await api.patch(`/events/${eventId}/status`, { status, feedback });
  return response.data;
};

// Update event details (for club admins)
export const updateEvent = async (eventId: string, eventData: Partial<NewEvent>): Promise<Event> => {
  const response = await api.patch(`/events/${eventId}`, eventData);
  return response.data;
};

// Join event (for students)
export const joinEvent = async (eventId: string): Promise<{ message: string; event: Event }> => {
  const response = await api.post(`/events/${eventId}/join`);
  return response.data;
};

// Leave event (for students)
export const leaveEvent = async (eventId: string): Promise<{ message: string; event: Event }> => {
  const response = await api.post(`/events/${eventId}/leave`);
  return response.data;
};

export default api;