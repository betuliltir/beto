import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { createEvent, getEvents, updateEvent, leaveEvent, joinEvent } from '../services/api';
import { Event, NewEvent } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ClubAdminEventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<Partial<NewEvent>>({});
  const userRole = localStorage.getItem('userRole') || 'clubAdmin';
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await getEvents();
    setEvents(res);
  };

  const handleDateClick = () => {
    setFormData({});
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const clicked = events.find((e) => e._id === clickInfo.event.id);
    if (clicked) {
      setSelectedEvent(clicked);
      setFormData(clicked);
      setShowModal(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (selectedEvent && (selectedEvent.status === 'pending' || selectedEvent.status === 'rejected')) {
      await updateEvent(selectedEvent._id, formData);
    } else {
      await createEvent(formData as NewEvent);
    }
    setShowModal(false);
    loadEvents();
  };

  const handleJoin = async () => {
    if (!selectedEvent) return;
    await joinEvent(selectedEvent._id);
    loadEvents();
    setShowModal(false);
  };

  const handleLeave = async () => {
    if (!selectedEvent) return;
    await leaveEvent(selectedEvent._id);
    loadEvents();
    setShowModal(false);
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'orange';
      case 'rejected': return 'red';
      default: return '';
    }
  };

  const hasJoined = selectedEvent?.participants?.includes(user?._id);

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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Event Calendar</h3>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition" onClick={handleDateClick}>
                  Add Event
                </button>
              </div>

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
                  title: `${e.title} (${e.status})`,
                  start: e.start,
                  end: e.end,
                  color: getEventColor(e.status),
                }))}
                eventClick={handleEventClick}
                height="auto"
              />
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 focus:outline-none">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.title || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" rows={3} className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.description || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" name="location" className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.location || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <input type="text" name="eventType" className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.eventType || ''} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start</label>
                  <input type="datetime-local" name="start" className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.start || ''} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End</label>
                  <input type="datetime-local" name="end" className="w-full border border-gray-300 bg-white rounded px-3 py-2 mt-1" value={formData.end || ''} onChange={handleChange} />
                </div>
              </div>
              {selectedEvent?.status === 'rejected' && (
                <div className="text-sm text-red-600 mt-2">
                  Feedback: {selectedEvent.feedback}
                </div>
              )}
              {userRole === 'clubAdmin' && (
                <div className="text-sm text-indigo-700 mt-2">
                  Participants: {selectedEvent?.participants?.length || 0}
                </div>
              )}
              {userRole === 'student' && selectedEvent?.status === 'approved' && (
                <div className="flex justify-end">
                  {hasJoined ? (
                    <button onClick={handleLeave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">
                      Leave Event
                    </button>
                  ) : (
                    <button onClick={handleJoin} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">
                      Join Event
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubAdminEventCalendar;
