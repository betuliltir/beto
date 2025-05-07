// components/PosterApproval.tsx
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface PosterApprovalProps {
  onLogout: () => void;
}

const PosterApproval = ({ onLogout }: PosterApprovalProps) => {
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
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Poster Approval Dashboard
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Review and approve event posters
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="text-center py-10">
                      <p className="text-gray-500">No pending posters for approval</p>
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

export default PosterApproval;