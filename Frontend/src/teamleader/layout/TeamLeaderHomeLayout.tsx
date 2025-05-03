import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import SharedNavbar from '../../shared/components/SharedNavbar';
import FullFooter from '../../shared/components/FullFooter';
import SharedSidebar from '../../shared/components/SharedSidebar';
import { SharedSidebarProvider, useSharedSidebar } from '../../shared/context/SharedSidebarContext';
import '../../styles/layouts.css';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const TeamLeaderHomeLayoutContent: React.FC = () => {
  const { isMobileOpen, toggleMobile, isExpanded, isHovered, setIsHovered } = useSharedSidebar();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and has the correct role
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log('Full decoded token:', decoded);

      // Get role from token or localStorage
      const userRole = decoded.role?.toLowerCase();
      const storedRole = localStorage.getItem('userRole')?.toLowerCase();

      console.log('Checking team leader role - Token role:', userRole, 'Stored role:', storedRole);

      // Check both token role and stored role
      if ((userRole !== 'teamleader' && decoded.role !== 'TeamLeader') && storedRole !== 'teamleader') {
        console.log('Role mismatch - Token role:', userRole, 'Stored role:', storedRole);
        navigate('/unauthorized');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/signin');
    }
  }, [navigate]);



  return (
    <div className="layout-container">
      {/* Navbar - scrolls with the page */}
      <div className="navbar-container">
        <SharedNavbar title="Dashboard" bgColor="bg-white" />
      </div>

      {/* Sidebar */}
      <SharedSidebar
        role="TeamLeader"
        isExpanded={isExpanded}
        isMobileOpen={isMobileOpen}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
      />

      {/* Main content */}
      <div className="main-content">

        {/* Content area */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Button */}
      <div className="mobile-menu-button">
        <button
          type="button"
          onClick={toggleMobile}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>

      {/* Footer - Full width and visible */}
      <FullFooter />
    </div>
  );
};

const TeamLeaderHomeLayout: React.FC = () => {
  return (
    <SharedSidebarProvider>
      <TeamLeaderHomeLayoutContent />
    </SharedSidebarProvider>
  );
};

export default TeamLeaderHomeLayout;
