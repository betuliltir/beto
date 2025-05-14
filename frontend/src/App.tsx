// App.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PosterApproval from './components/PosterApproval';
import NotFound from './components/NotFound';
import Club from './pages/Club'; 
import ClubAdminEventCalendar from './pages/ClubAdminEventCalendar';
import UniversityAdminEventCalendar from './pages/UniversityAdminEventCalendar';
import StudentEventCalendar from './pages/StudentEventCalendar';


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Protected route component
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />
        } />
        
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/home" /> : <Register onRegister={handleLogin} />
        } />
        
        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        
        {/* ADD THIS ROUTE - it was missing! */}
        <Route path="/clubs" element={
          <ProtectedRoute>
            <Club onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        
        <Route path="/poster-approval" element={
          <ProtectedRoute>
            <PosterApproval onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        
        {/* Default routes */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/event-calendar" element={<ClubAdminEventCalendar />} />
        <Route path="/admin-calendar" element={<UniversityAdminEventCalendar />} />
        <Route path="/student-calendar" element={<StudentEventCalendar />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;