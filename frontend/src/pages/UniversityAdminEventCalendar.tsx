import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getEvents, updateEventStatus } from '../services/api';
import { Event } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const UniversityAdminEventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const userRole = localStorage.getItem('userRole') || 'universityAdmin';

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await getEvents();
    setEvents(res);
  };

  const handleEventClick = (clickInfo: any) => {
    const clicked = events.find((e) => e._id === clickInfo.event.id);
    if (clicked) {
      setSelectedEvent(clicked);
      setFeedback(clicked.feedback || '');
      setShowModal(true);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedEvent) return;
    await updateEventStatus(selectedEvent._id, status, status === 'rejected' ? feedback : undefined);
    setShowModal(false);
    setSelectedEvent(null);
    loadEvents();
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'orange';
      case 'rejected': return 'red';
      default: return '';
    }
  };

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
                        background-color: #6366f1; /* indigo-500 */
                        border-color: #6366f1;
                    }
                    .fc .fc-button-primary:hover {
                        background-color: #4f46e5; /* indigo-600 */
                        border-color: #4f46e5;
                    }
                    .fc .fc-button-primary:disabled {
                        background-color: #a5b4fc; /* indigo-300 */
                        border-color: #a5b4fc;
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

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Review Event</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 focus:outline-none">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p><strong>Title:</strong> {selectedEvent.title}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
              <p><strong>Location:</strong> {selectedEvent.location}</p>
              <p><strong>Event Type:</strong> {selectedEvent.eventType}</p>
              <p><strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
              <p><strong>End:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback (required for rejection)"
                className="w-full border border-gray-300 bg-white rounded px-3 py-2"
              />
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={() => handleDecision('rejected')} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded">
                Reject
              </button>
              <button onClick={() => handleDecision('approved')} className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityAdminEventCalendar;
