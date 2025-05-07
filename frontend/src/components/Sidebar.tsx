import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  userRole?: string;
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Base links for all user types
  const links = [
    { label: 'Event Calendar', path: '/home' },
    { label: 'Club Membership', path: '/membership' },
    { label: 'Feedback', path: '/feedback' },
  ];

  // Add poster approval link for club or university admins
  if (userRole === 'clubAdmin' || userRole === 'universityAdmin') {
    links.push({ label: 'Poster Approval', path: '/poster-approval' });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
      <div className="space-y-4">
        {links.map(link => (
          <button
            key={link.label}
            className={`w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-100 transition
              ${location.pathname === link.path ? 'bg-indigo-200 text-indigo-800 font-semibold border-l-4 border-indigo-500' : 'bg-indigo-50 text-indigo-700'}`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;