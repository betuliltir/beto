import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import Sidebar from '../components/Sidebar';
import type { Announcement, Event } from '../types';

const Home = () => {
  const navigate = useNavigate();
  const [announcements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Welcome to InterClub!',
      content: 'We are excited to announce the launch of our new platform.',
      date: '2024-03-06',
      author: 'University Admin',
    },
    // Add more announcements as needed
  ]);

  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Spring Club Fair',
      description: 'Join us for the annual spring club fair!',
      date: '2024-03-15',
      location: 'Main Campus Square',
      organizer: 'Student Activities Office',
    },
    // Add more events as needed
  ]);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">InterClub</h1>
            </div>
            <nav className="flex space-x-4">
              <Link to="/home" className="text-gray-700 hover:text-indigo-600">
                Home
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-indigo-600">
                Profile
              </Link>
              <button
                className="text-gray-700 hover:text-indigo-600"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Quick Access Links */}
          <Sidebar userRole={user.role} />

          {/* Middle Section - Announcements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Announcements</h2>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border-b pb-4">
                  <h3 className="font-medium">{announcement.title}</h3>
                  <p className="text-gray-600 mt-1">{announcement.content}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    {announcement.date} • {announcement.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Upcoming Events & News */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-b pb-4">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      {event.date} • {event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Club News Highlights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Club News</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">New Club Registration Open</h3>
                  <p className="text-gray-600 mt-1">
                    Register your new club for the upcoming semester.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">Club Leadership Workshop</h3>
                  <p className="text-gray-600 mt-1">
                    Join us for a workshop on effective club management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home; 