// components/PosterApproval.tsx
import { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import axios from 'axios';

interface PosterApprovalProps {
  onLogout: () => void;
}

interface Poster {
  _id: string;
  clubName: string;
  fileUrl: string;
  status: 'Pending' | 'Approved' | 'Requested Change';
  feedback?: string;
  createdAt: string;
}

const PosterApproval = ({ onLogout }: PosterApprovalProps) => {
  // Get user role and info from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role || 'student';
  const clubName = user?.clubName || '';
  
  // State variables
  const [posters, setPosters] = useState<Poster[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ [id: string]: string }>({});
  const [decision, setDecision] = useState<{ [id: string]: 'Approved' | 'Requested Change' | '' }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal state variables
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentPosterUrl, setCurrentPosterUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Fetch posters on component mount
  useEffect(() => {
    fetchPosters();
  }, []);

  // Helper function to fix image URLs
  const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  
    const baseBackendUrl = 'http://localhost:5001';
    return `${baseBackendUrl}${url.startsWith('/uploads') ? url : `/uploads/${url}`}`;
  };

  // Modal open/close functions
  const openPosterModal = (fileUrl: string) => {
    setCurrentPosterUrl(fileUrl);
    setModalOpen(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closePosterModal = () => {
    setModalOpen(false);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

  // Close the modal when clicking outside the image
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePosterModal();
    }
  };

  // Fetch posters from API
  const fetchPosters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/posters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosters(response.data);
    } catch (err: any) {
      console.error('Error fetching posters:', err);
      setError(err.response?.data?.message || 'Failed to fetch posters');
    } finally {
      setLoading(false);
    }
  };

  // Club Admin: Handle poster upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('poster', file);
      formData.append('clubName', clubName);
      
      await axios.post('/api/posters', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Clear file input and state
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
      // Show success message
      setSuccessMessage('Poster submitted successfully!');
      
      // Refresh posters list
      fetchPosters();
    } catch (err: any) {
      console.error('Error uploading poster:', err);
      setError(err.response?.data?.message || 'Failed to upload poster');
    } finally {
      setLoading(false);
    }
  };

  // University Admin: Handle poster approval/rejection
  const handleUpdate = async (posterId: string) => {
    if (!decision[posterId]) {
      setError('Please select a decision (Approve or Request Change)');
      return;
    }
    
    // If requesting change but no feedback provided
    if (decision[posterId] === 'Requested Change' && !feedback[posterId]) {
      setError('Please provide feedback when requesting changes');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
      }
      
      await axios.patch(`/api/posters/${posterId}`, {
        status: decision[posterId],
        feedback: feedback[posterId] || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear decision and feedback for this poster
      setDecision(prev => {
        const newDecisions = {...prev};
        delete newDecisions[posterId];
        return newDecisions;
      });
      
      setFeedback(prev => {
        const newFeedback = {...prev};
        delete newFeedback[posterId];
        return newFeedback;
      });
      
      // Show success message
      setSuccessMessage('Poster status updated successfully!');
      
      // Refresh posters list
      fetchPosters();
    } catch (err: any) {
      console.error('Error updating poster:', err);
      setError(err.response?.data?.message || 'Failed to update poster status');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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
                {/* Common header for both user types */}
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {userRole === 'clubAdmin' ? 'Poster Submission' : 'Poster Approval Dashboard'}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {userRole === 'clubAdmin' 
                      ? 'Submit and manage event posters' 
                      : 'Review and approve club event posters'}
                  </p>
                </div>
                
                {/* Error and success messages */}
                {error && (
                  <div className="mx-4 my-2 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {successMessage && (
                  <div className="mx-4 my-2 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Club Admin View: Submit Poster Form */}
                {userRole === 'clubAdmin' && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                      <form onSubmit={handleUpload} className="mb-6">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">Upload Poster</label>
                          <div className="mt-1 flex items-center space-x-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                              className="py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              accept="image/*,application/pdf"
                            />
                            <button
                              type="submit"
                              disabled={loading || !file}
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {loading ? 'Uploading...' : 'Submit'}
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Accepted file formats: JPEG, PNG, GIF, PDF. Maximum file size: 5MB.
                          </p>
                        </div>
                      </form>
                      
                      <h4 className="text-md font-medium text-gray-700 mb-4">My Submissions</h4>
                      
                      {loading && posters.length === 0 ? (
                        <div className="text-center py-6">
                          <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {posters.length > 0 ? (
                            posters.map((poster) => (
                              <div key={poster._id} className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="p-4 border-b">
                                  <div className="flex justify-between items-center">
                                    <span 
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        poster.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        poster.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {poster.status}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(poster.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="p-4">
                                  <div className="flex justify-center mb-4">
                                    <img
                                      src={getImageUrl(poster.fileUrl)}
                                      alt="Poster preview"
                                      className="max-h-40 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder-image.png';
                                        target.alt = 'Preview not available';
                                      }}
                                    />
                                  </div>
                                  
                                  {/* View Full Size with thumbnail and onClick handler */}
                                  <div className="flex justify-center">
                                    <div 
                                      className="flex items-center cursor-pointer text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-2 rounded-md transition-colors"
                                      onClick={() => openPosterModal(poster.fileUrl)}
                                    >
                                      <img 
                                        src={getImageUrl(poster.fileUrl)} 
                                        alt="Thumbnail" 
                                        className="w-8 h-8 object-cover border border-gray-200 rounded mr-2" 
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/placeholder-image.png';
                                        }}
                                      />
                                      <span className="text-sm font-medium">View Full Size</span>
                                    </div>
                                  </div>
                                  
                                  {poster.feedback && (
                                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                                      <p className="text-sm text-gray-700">
                                        <span className="font-medium">Feedback: </span>
                                        {poster.feedback}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-10">
                              <p className="text-gray-500">No submissions yet. Upload your first poster!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* University Admin View: Approve Posters */}
                {userRole === 'universityAdmin' && (
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                      {loading && posters.length === 0 ? (
                        <div className="text-center py-6">
                          <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <>
                          {/* Info box for pending submissions */}
                          {posters.filter(poster => poster.status === 'Pending').length > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm text-yellow-700">
                                    There are {posters.filter(poster => poster.status === 'Pending').length} poster{posters.filter(poster => poster.status === 'Pending').length !== 1 ? 's' : ''} awaiting your review.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {posters.length > 0 ? (
                            <div className="space-y-6">
                              {posters.map((poster) => (
                                <div key={poster._id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                  <div className="p-4 border-b bg-gray-50">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className="font-medium">Club: </span>
                                        <span>{poster.clubName}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span 
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            poster.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            poster.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {poster.status}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(poster.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="flex justify-center">
                                        <img
                                          src={getImageUrl(poster.fileUrl)}
                                          alt="Poster preview"
                                          className="max-h-60 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder-image.png';
                                            target.alt = 'Preview not available';
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="md:col-span-2">
                                        {/* View Full Size with thumbnail and onClick handler */}
                                        <div className="flex mb-4">
                                          <div 
                                            className="flex items-center cursor-pointer text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-2 rounded-md transition-colors"
                                            onClick={() => openPosterModal(poster.fileUrl)}
                                          >
                                            <img 
                                              src={getImageUrl(poster.fileUrl)} 
                                              alt="Thumbnail" 
                                              className="w-8 h-8 object-cover border border-gray-200 rounded mr-2" 
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.png';
                                              }}
                                            />
                                            <span className="text-sm font-medium">View Full Size</span>
                                          </div>
                                        </div>
                                        
                                        {poster.status !== 'Pending' ? (
                                          <div className="bg-gray-50 p-3 rounded-md">
                                            <p className="text-sm text-gray-700">
                                              <span className="font-medium">Status: </span>
                                              {poster.status}
                                            </p>
                                            {poster.feedback && (
                                              <p className="text-sm text-gray-700 mt-2">
                                                <span className="font-medium">Feedback: </span>
                                                {poster.feedback}
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="mt-4">
                                            <div className="space-y-4">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                                                <div className="flex space-x-4">
                                                  <label className="inline-flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={`decision_${poster._id}`}
                                                      value="Approved"
                                                      checked={decision[poster._id] === 'Approved'}
                                                      onChange={() => setDecision({
                                                        ...decision, 
                                                        [poster._id]: 'Approved'
                                                      })}
                                                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Approve</span>
                                                  </label>
                                                  
                                                  <label className="inline-flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={`decision_${poster._id}`}
                                                      value="Requested Change"
                                                      checked={decision[poster._id] === 'Requested Change'}
                                                      onChange={() => setDecision({
                                                        ...decision, 
                                                        [poster._id]: 'Requested Change'
                                                      })}
                                                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Request Changes</span>
                                                  </label>
                                                </div>
                                              </div>
                                              
                                              {decision[poster._id] === 'Requested Change' && (
                                                <div>
                                                  <label
                                                    htmlFor={`feedback_${poster._id}`}
                                                    className="block text-sm font-medium text-gray-700 mb-2"
                                                  >
                                                    Feedback
                                                  </label>
                                                  <textarea
                                                    id={`feedback_${poster._id}`}
                                                    rows={3}
                                                    value={feedback[poster._id] || ''}
                                                    onChange={(e) => setFeedback({
                                                      ...feedback,
                                                      [poster._id]: e.target.value
                                                    })}
                                                    placeholder="Provide feedback for requested changes"
                                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                  />
                                                </div>
                                              )}
                                              
                                              <div>
                                                <button
                                                  onClick={() => handleUpdate(poster._id)}
                                                  disabled={!decision[poster._id] || (decision[poster._id] === 'Requested Change' && !feedback[poster._id]) || loading}
                                                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                >
                                                  {loading ? 'Submitting...' : 'Submit Decision'}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10">
                              <p className="text-gray-500">No posters have been submitted for approval yet.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for viewing full-size poster */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleModalClick}
        >
          <div className="relative max-w-4xl max-h-screen p-2">
            <button
              onClick={closePosterModal}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
              style={{ zIndex: 60 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={getImageUrl(currentPosterUrl)} 
              alt="Full size poster" 
              className="max-w-full max-h-[90vh] object-contain bg-white"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.png';
                target.alt = 'Image not available';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterApproval;