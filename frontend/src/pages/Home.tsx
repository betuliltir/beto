// pages/Home.tsx
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

interface HomeProps {
  onLogout: () => void;
}

const Home = ({ onLogout }: HomeProps) => {
  // Get user role from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role || 'student';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Sidebar userRole={userRole} />
            </div>
            
            <div className="md:col-span-3">
              {/* Main content */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Welcome to InterClub
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Your university club management platform
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-md font-medium text-gray-900 mb-2">
                          We are excited to announce the launch of our new platform.
                        </h4>
                        <p className="text-sm text-gray-500">2024-03-06 • University Admin</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-md font-medium text-gray-900 mb-2">
                          Join us for the annual spring club fair!
                        </h4>
                        <p className="text-sm text-gray-500">2024-03-15 • Main Campus Square</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-md font-medium text-gray-900 mb-2">
                          Register your new club for the upcoming semester.
                        </h4>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="text-md font-medium text-gray-900 mb-2">
                          Join us for a workshop on effective club management.
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;