import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import SharedNavbar from '../../shared/components/SharedNavbar';
import SimpleFooter from '../../shared/components/SimpleFooter';
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

const MemberHomeLayoutContent: React.FC = () => {
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

      console.log('Checking member role - Token role:', userRole, 'Stored role:', storedRole);

      // Check both token role and stored role - accept both "member" and "Member"
      console.log('Checking member role - Token role:', decoded.role, 'Stored role:', localStorage.getItem('userRole'));

      const isMember =
        userRole === 'member' ||
        decoded.role === 'member' ||
        decoded.role === 'Member' ||
        storedRole === 'member' ||
        storedRole === 'Member' ||
        localStorage.getItem('userRole') === 'Member';

      if (!isMember) {
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
        role="Member"
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
          className="bg-green-600 text-white p-3 rounded-full shadow-lg"
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
      <footer className="footer-container">
        <SimpleFooter />
      </footer>
    </div>
  );
};

const MemberHomeLayout: React.FC = () => {
  return (
    <SharedSidebarProvider>
      <MemberHomeLayoutContent />
    </SharedSidebarProvider>
  );
};

export default MemberHomeLayout;
