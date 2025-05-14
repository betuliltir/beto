// frontend/src/pages/Club.tsx - Updated for club admin member viewing
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllClubs, createClub, deleteClub, joinClub, leaveClub, getClubMembers } from '../services/api';
import type { Club, NewClub, ClubMember } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// Add this interface for proper error typing
interface ApiError {
  response?: {
    data: any;
    status: number;
  };
  message: string;
}

interface ClubPageProps {
  onLogout: () => void;
}

const Club: React.FC<ClubPageProps> = ({ onLogout }) => {
  // Get user data from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role || 'student';
  
  // State variables
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newClub, setNewClub] = useState<NewClub>({ 
    name: '', 
    description: '',
    category: '', 
    clubImage: undefined 
  });
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // New state variables for members popup
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedClubName, setSelectedClubName] = useState<string>("");

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClubs();
      setClubs(data);
    } catch (err) {
      const error = err as ApiError; // Type assertion
      console.error('Error fetching clubs:', error);
      setError('Failed to load clubs');
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle showing members popup
  const handleShowMembers = async (clubId: string) => {
    try {
      setLoadingMembers(true);
      setError(null);
      
      // Find the club for the header display
      const selectedClub = clubs.find(club => club._id === clubId);
      if (selectedClub) {
        setSelectedClubName(selectedClub.name);
      }
      
      // Fetch real members from the API
      const members = await getClubMembers(clubId);
      setClubMembers(members);
      setShowMembersPopup(true);
    } catch (err) {
      const error = err as ApiError;
      console.error('Error fetching club members:', error);
      
      // Show error toast
      toast.error('Failed to load club members');
      
      // Still show popup but with empty members list
      setClubMembers([]);
      setShowMembersPopup(true);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setNewClub({ ...newClub, clubImage: file });
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    try {
      const clubData: NewClub = {
        ...newClub,
        clubImage: selectedImage || undefined
      };
      
      const data = await createClub(clubData);
      setClubs([...clubs, data]);
      
      // Reset form
      setNewClub({ name: '', description: '', category: '', clubImage: undefined });
      setSelectedImage(null);
      setImagePreview(null);
      setIsAdding(false);
      
      // Reset file input
      const fileInput = document.getElementById('clubImage') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      setSuccessMessage('Club added successfully!');
      toast.success('Club added successfully');
      
      // Refresh clubs
      await fetchClubs();
    } catch (err) {
      const error = err as ApiError; // Type assertion
      console.error('Error adding club:', error);
      setError('Failed to add club');
      toast.error('Failed to add club');
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        setError(null);
        setSuccessMessage(null);
        
        console.log('Deleting club with ID:', clubId);
        console.log('Authorization token:', localStorage.getItem('token'));
        
        await deleteClub(clubId);
        
        setClubs(clubs.filter(club => club._id !== clubId));
        setSuccessMessage('Club deleted successfully!');
        toast.success('Club deleted successfully');
      } catch (err) {
        const error = err as ApiError; // Type assertion
        console.error('Error deleting club:', error);
        
        // Add more detailed error logging
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Status code:', error.response.status);
          
          // Show more specific error message based on status code
          if (error.response.status === 403) {
            setError('You are not authorized to delete this club');
            toast.error('Permission denied: You cannot delete this club');
          } else if (error.response.status === 404) {
            setError('Club not found');
            toast.error('Club not found');
          } else {
            setError(`Failed to delete club: ${error.response.data?.message || 'Unknown error'}`);
            toast.error('Failed to delete club');
          }
        } else {
          setError('Failed to delete club: Network error');
          toast.error('Failed to delete club: Check your connection');
        }
      }
    }
  };

  // Join club function
  const handleJoinClub = async (clubId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      await joinClub(clubId);
      
      // Show success message
      setSuccessMessage('Successfully joined the club!');
      toast.success('Successfully joined the club!');
      
      // Refresh clubs
      await fetchClubs();
    } catch (err) {
      const error = err as ApiError;
      console.error('Error joining club:', error);
      
      if (error.response) {
        setError(`Failed to join club: ${error.response.data?.message || 'Unknown error'}`);
        toast.error(`Failed to join club: ${error.response.data?.message || 'Unknown error'}`);
      } else {
        setError('Failed to join club: Network error');
        toast.error('Failed to join club: Check your connection');
      }
    }
  };

  // Leave club function
  const handleLeaveClub = async (clubId: string) => {
    if (window.confirm('Are you sure you want to leave this club?')) {
      try {
        setError(null);
        setSuccessMessage(null);
        
        await leaveClub(clubId);
        
        // Show success message
        setSuccessMessage('Successfully left the club!');
        toast.success('Successfully left the club!');
        
        // Refresh clubs
        await fetchClubs();
      } catch (err) {
        const error = err as ApiError;
        console.error('Error leaving club:', error);
        
        if (error.response) {
          setError(`Failed to leave club: ${error.response.data?.message || 'Unknown error'}`);
          toast.error(`Failed to leave club: ${error.response.data?.message || 'Unknown error'}`);
        } else {
          setError('Failed to leave club: Network error');
          toast.error('Failed to leave club: Check your connection');
        }
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewClub({ name: '', description: '', category: '', clubImage: undefined });
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('clubImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get the club admin's club
  const adminClub = userRole === 'clubAdmin' && user?.clubName 
    ? clubs.find(club => club.name === user.clubName) 
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Left Side */}
          <div className="md:col-span-1">
            <Sidebar userRole={userRole} />
          </div>
          
          {/* Main Content Area - Right Side */}
          <div className="md:col-span-3">
            {/* Admin Header with Members Count - Only for club admins */}
            {userRole === 'clubAdmin' && adminClub && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{adminClub.name}</h2>
                  </div>
                  <button 
                    onClick={() => handleShowMembers(adminClub._id)}
                    className="bg-indigo-50 py-2 px-4 rounded-full flex items-center hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-indigo-700 font-medium">
                      {adminClub.memberCount || 0} Members
                    </span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Members Popup */}
            {showMembersPopup && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                  <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Club Members - {selectedClubName}</h3>
                    <button
                      onClick={() => setShowMembersPopup(false)}
                      className="text-white hover:text-gray-200 focus:outline-none"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    {loadingMembers ? (
                      <div className="flex justify-center py-4">
                        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : clubMembers.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {clubMembers.map(member => (
                          <div key={member._id} className="py-3 flex items-start">
                            <div className="bg-indigo-100 rounded-full p-2 mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No members found</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right">
                    <button
                      onClick={() => setShowMembersPopup(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Header */}
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  University Clubs
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manage university clubs and their information
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
              
              {/* Add New Club Button - for universityAdmin */}
              {userRole === 'universityAdmin' && (
                <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isAdding ? 'Cancel' : 'Add New Club'}
                  </button>
                </div>
              )}

              {/* Add Club Form */}
              {isAdding && userRole === 'universityAdmin' && (
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleAddClub}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Club Name</label>
                        <input
                          type="text"
                          className="bg-white text-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                          value={newClub.name}
                          onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={4}
                          className="bg-white text-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                          value={newClub.description}
                          onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                        <input
                          type="text"
                          className="bg-white text-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                          value={newClub.category || ''}
                          onChange={(e) => setNewClub({ ...newClub, category: e.target.value })}
                          placeholder="e.g., Sports, Arts, Technology"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Club Image (Optional)</label>
                        <input
                          id="clubImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="bg-white text-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2"
                        />
                        {imagePreview && (
                          <div className="mt-2">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="max-w-xs max-h-48 object-contain rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Add Club
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Clubs List */}
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  {loading ? (
                    <div className="text-center py-6">
                      <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : clubs.length > 0 ? (
                    <div className="space-y-4">
                      {clubs.map(club => (
                        <div key={club._id} className="bg-white border rounded-lg shadow-sm overflow-hidden p-4">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">{club.name}</h2>
                            </div>
                            
                            <div className="mt-2 md:mt-0 flex space-x-2">
                              {/* University Admin - View Members + Delete buttons */}
                              {userRole === 'universityAdmin' && (
                                <>
                                  <button
                                    onClick={() => handleShowMembers(club._id)}
                                    className="bg-indigo-50 py-2 px-4 rounded text-sm text-indigo-700 hover:bg-indigo-100 transition"
                                  >
                                    View Members ({club.memberCount || 0})
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClub(club._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              
                              {/* Student - Join/Exit buttons */}
                              {userRole === 'student' && (
                                club.isMember ? (
                                  <button
                                    onClick={() => handleLeaveClub(club._id)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded"
                                  >
                                    Exit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleJoinClub(club._id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded"
                                  >
                                    Join
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-gray-700 text-sm mb-2">{club.description}</p>
                            {club.category && (
                              <p className="text-sm text-indigo-600 mb-2">
                                Category: {club.category}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Created: {formatDate(club.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No clubs yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {userRole === 'universityAdmin' ? 'Get started by adding a new club.' : 'Check back later for available clubs.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Club;