export type UserRole = 'student' | 'clubAdmin' | 'universityAdmin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  clubName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  studentId?: string;
  clubName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
} 