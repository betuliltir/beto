import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const isActive = (path: string) => currentPath === path;

  const getLinkStyle = (path: string) =>
    isActive(path)
      ? 'block py-2 px-4 bg-indigo-100 text-indigo-800 font-medium rounded'
      : 'block py-2 px-4 text-gray-700 hover:bg-indigo-50 rounded';

  const renderEventCalendarLink = () => {
    if (userRole === 'student') {
      return (
        <li>
          <Link to="/student-calendar" className={getLinkStyle('/student-calendar')}>
            Event Calendar
          </Link>
        </li>
      );
    }
    if (userRole === 'clubAdmin') {
      return (
        <li>
          <Link to="/event-calendar" className={getLinkStyle('/event-calendar')}>
            Event Calendar
          </Link>
        </li>
      );
    }
    if (userRole === 'universityAdmin') {
      return (
        <li>
          <Link to="/admin-calendar" className={getLinkStyle('/admin-calendar')}>
            Event Calendar
          </Link>
        </li>
      );
    }
    return null;
  };

  const renderUserInfo = () => {
    if (userRole === 'clubAdmin' && user?.clubName) {
      return (
        <>
          <h3 className="text-sm text-indigo-800 font-semibold text-center">Club Admin</h3>
          <p className="text-indigo-700 font-medium text-center">{user.clubName}</p>
        </>
      );
    }
    if (userRole === 'universityAdmin') {
      return <h3 className="text-sm text-indigo-800 font-semibold text-center">University Admin</h3>;
    }
    if (userRole === 'student') {
      return <h3 className="text-sm text-indigo-800 font-semibold text-center">Student</h3>;
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {(userRole === 'clubAdmin' || userRole === 'universityAdmin' || userRole === 'student') && (
        <div className="mb-6 p-3 bg-indigo-50 rounded border border-indigo-100">
          {renderUserInfo()}
        </div>
      )}

      <ul className="space-y-2">
        {renderEventCalendarLink()}
        <li>
          <Link to="/clubs" className={getLinkStyle('/clubs')}>
            Clubs
          </Link>
        </li>
        <li>
          <Link to="/feedback" className={getLinkStyle('/feedback')}>
            Feedback
          </Link>
        </li>
        {(userRole === 'universityAdmin' || userRole === 'clubAdmin') && (
          <li>
            <Link to="/poster-approval" className={getLinkStyle('/poster-approval')}>
              Poster Approval
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
