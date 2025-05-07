import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { logout } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Poster {
  _id: string;
  clubName: string;
  fileUrl: string;
  status: 'Pending' | 'Approved' | 'Requested Change';
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
}

const PosterApproval = () => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ [id: string]: 'Approved' | 'Requested Change' | '' }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPosters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const res = await axios.get('/api/posters', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosters(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error fetching posters');
      console.error('Error fetching posters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosters();
  }, []);

  // Club Admin: Upload poster
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, GIF, and PDF are allowed');
      }
      
      const formData = new FormData();
      formData.append('poster', file);
      formData.append('clubName', user.clubName || '');
      
      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const response = await axios.post('/api/posters', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPosters();
    } catch (err: any) {
      console.error('Error uploading poster:', err);
      if (err.response) {
        console.error('Response error data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setError(err.response?.data?.message || err.message || 'Error uploading poster');
    } finally {
      setLoading(false);
    }
  };

  // University Admin: Approve/Request Change/Feedback
  const handleUpdate = async (id: string) => {
    if (!decision[id]) {
      setError('Please select a decision (Approve or Request Change)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await axios.patch(`/api/posters/${id}`, {
        status: decision[id],
        feedback: feedback[id] || '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Clear the decision and feedback for this poster after successful update
      setDecision(prev => {
        const newDecisions = {...prev};
        delete newDecisions[id];
        return newDecisions;
      });
      
      setFeedback(prev => {
        const newFeedback = {...prev};
        delete newFeedback[id];
        return newFeedback;
      });
      
      fetchPosters();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error updating poster');
      console.error('Error updating poster:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">
          Loading user information...
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar userRole={user.role} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                Error: {error}
              </div>
            )}
            
            {user.role === 'clubAdmin' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Poster Submission</h2>
                <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Upload New Poster
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        ref={fileInputRef}
                        className="block text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-2 w-full"
                      />
                      <button
                        type="submit"
                        disabled={!file || loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {loading ? 'Submitting...' : 'Submit Poster'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted file types: JPG, PNG, GIF, PDF (Max size: 10MB)
                    </p>
                  </div>
                </form>
                
                <h3 className="text-xl font-semibold mb-4">My Submissions</h3>
                
                {loading && posters.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posters.map((poster) => (
                      <div key={poster._id} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            poster.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            poster.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {poster.status}
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            {new Date(poster.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <img
                            src={poster.fileUrl}
                            alt="Poster thumbnail"
                            className="w-full h-48 object-contain rounded border bg-gray-50"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png';
                              target.alt = 'Preview not available';
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <a 
                            href={poster.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View Full Size
                          </a>
                        </div>
                        
                        {poster.feedback && (
                          <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
                            <span className="font-medium">Feedback:</span> {poster.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                    {posters.length === 0 && !loading && (
                      <div className="col-span-full bg-white p-8 rounded-lg border text-center text-gray-500">
                        No submissions yet. Upload your first poster using the form above.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {user.role === 'universityAdmin' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Poster Approval Dashboard</h2>
                
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-xl font-semibold">All Submissions</h3>
                  <button 
                    onClick={fetchPosters}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm flex items-center gap-1"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                
                {loading && posters.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posters.filter(poster => poster.status === 'Pending').length > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              There are {posters.filter(poster => poster.status === 'Pending').length} pending submissions requiring your review.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {posters.map((poster) => (
                      <div key={poster._id} className="bg-white p-6 rounded-lg border shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className="md:w-1/4">
                            <div className="mb-3">
                              <img
                                src={poster.fileUrl}
                                alt="Poster"
                                className="w-full h-48 object-contain rounded border bg-gray-50"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-image.png';
                                  target.alt = 'Preview not available';
                                }}
                              />
                            </div>
                            
                            <div className="mt-2">
                              <a 
                                href={poster.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Full Size
                              </a>
                            </div>
                          </div>
                          
                          <div className="md:w-3/4">
                            <div className="flex flex-wrap justify-between mb-4">
                              <div>
                                <span className="text-sm text-gray-500">Club:</span> 
                                <span className="font-semibold ml-1">{poster.clubName}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  poster.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  poster.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {poster.status}
                                </span>
                                
                                <span className="text-xs text-gray-500">
                                  Submitted: {new Date(poster.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {poster.status !== 'Pending' && poster.feedback && (
                              <div className="mb-4 text-sm bg-gray-100 p-2 rounded">
                                <span className="font-medium">Previous Feedback:</span> {poster.feedback}
                              </div>
                            )}
                            
                            {poster.status === 'Pending' && (
                              <div className="mt-4 border-t pt-4">
                                <div className="flex items-center gap-4 mb-3">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`decision-${poster._id}`}
                                      value="Approved"
                                      checked={decision[poster._id] === 'Approved'}
                                      onChange={() => setDecision({...decision, [poster._id]: 'Approved'})}
                                      className="text-indigo-600"
                                    />
                                    <span>Approve</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`decision-${poster._id}`}
                                      value="Requested Change"
                                      checked={decision[poster._id] === 'Requested Change'}
                                      onChange={() => setDecision({...decision, [poster._id]: 'Requested Change'})}
                                      className="text-indigo-600"
                                    />
                                    <span>Request Change</span>
                                  </label>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Provide feedback"
                                    value={feedback[poster._id] || ''}
                                    onChange={(e) => setFeedback({...feedback, [poster._id]: e.target.value})}
                                    className="flex-1 border rounded px-3 py-2 text-sm"
                                    disabled={!decision[poster._id] || decision[poster._id] === 'Approved'}
                                  />
                                  
                                  <button
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                                    disabled={loading || !decision[poster._id]}
                                    onClick={() => handleUpdate(poster._id)}
                                  >
                                    {loading ? 'Submitting...' : 'Submit Decision'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {posters.length === 0 && !loading && (
                      <div className="bg-white p-8 rounded-lg border text-center text-gray-500">
                        No poster submissions available.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PosterApproval;