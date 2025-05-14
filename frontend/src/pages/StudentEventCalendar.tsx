import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getEvents, leaveEvent, joinEvent } from '../services/api';
import { Event } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const StudentEventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const userRole = localStorage.getItem('userRole') || 'student';
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await getEvents();
    const approved = res.filter(e => e.status === 'approved');
    setEvents(approved);
  };

  const handleEventClick = (clickInfo: any) => {
    const clicked = events.find((e) => e._id === clickInfo.event.id);
    if (clicked) {
      setSelectedEvent(clicked);
      setShowModal(true);
    }
  };

  const handleJoin = async () => {
    if (!selectedEvent) return;
    await joinEvent(selectedEvent._id);
    setSelectedEvent(null); // <-- bu satırı ekle
    loadEvents();
    setShowModal(false);
  };

  const handleLeave = async () => {
    if (!selectedEvent) return;
    await leaveEvent(selectedEvent._id);
    setSelectedEvent(null); // <-- bu satırı ekle
    loadEvents();
    setShowModal(false);
  };

  const getEventColor = () => '#6366f1';

  const hasJoined = selectedEvent?.participants?.includes(user?._id) || false;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar onLogout={() => {
        localStorage.clear();
        window.location.href = '/login';
      }} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Sidebar userRole={userRole} />
          </div>

          <div className="md:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Event Calendar</h3>
                <style>
                {`
                  .fc .fc-button-primary {
                    background-color: #6366f1;
                    border-color: #6366f1;
                    color: #ffffff;
                  }
                  .fc .fc-button-primary:hover {
                    background-color: #4f46e5;
                    border-color: #4f46e5;
                  }
                  .fc .fc-button-primary:disabled {
                    background-color: #a5b4fc;
                    border-color: #a5b4fc;
                    color: #e0e7ff;
                  }
                `}
              </style>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events.map((e) => ({
                  id: e._id,
                  title: e.title,
                  start: e.start,
                  end: e.end,
                  color: getEventColor(),
                }))}
                eventClick={handleEventClick}
                height="auto"
              />
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Event Details</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 focus:outline-none">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p><strong>Title:</strong> {selectedEvent.title}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
              <p><strong>Location:</strong> {selectedEvent.location}</p>
              <p><strong>Event Type:</strong> {selectedEvent.eventType}</p>
              <p><strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
              {userRole === 'student' && selectedEvent.status === 'approved' && (
                hasJoined ? (
                  <button onClick={handleLeave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
                    Leave Event
                  </button>
                ) : (
                  <button onClick={handleJoin} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">
                    Join Event
                  </button>
                )
              )}
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEventCalendar;