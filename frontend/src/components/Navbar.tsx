// components/Navbar.tsx
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar = ({ onLogout }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onLogout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">InterClub</h1>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/home" className="text-gray-700 hover:text-gray-900">Home</a>
            <a href="/profile" className="text-gray-700 hover:text-gray-900">Profile</a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;