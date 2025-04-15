import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AppAppBar from '../../home/components/AppAppBar';
import SimpleFooter from '../../shared/components/SimpleFooter';
import '../../styles/layouts.css';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const MemberHomeLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

      // Check both token role and stored role
      if ((userRole !== 'member' && decoded.role !== 'member') && storedRole !== 'member') {
        console.log('Role mismatch - Token role:', userRole, 'Stored role:', storedRole);
        navigate('/unauthorized');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/signin');
    }
  }, [navigate]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="layout-container">
      {/* Navbar - scrolls with the page */}
      <div className="navbar-container">
        <AppAppBar />
      </div>

      {/* Main content with sidebar */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar-member hidden md:block">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/member-dashboard"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/member/tasks"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Tasks
                </a>
              </li>
              <li>
                <a
                  href="/member/projects"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/member/time-tracking"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Time Tracking
                </a>
              </li>
              <li>
                <a
                  href="/member/team-chat"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Team Chat
                </a>
              </li>
              <li>
                <a
                  href="/member/profile"
                  className="block py-2 px-4 rounded hover:bg-gray-600"
                >
                  Profile
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Content area */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Button */}
      <div className="mobile-menu-button">
        <button
          type="button"
          onClick={toggleMenu}
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 md:hidden">
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={toggleMenu}
              className="text-white"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-4">
              <li>
                <a
                  href="/member-dashboard"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/member/tasks"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Tasks
                </a>
              </li>
              <li>
                <a
                  href="/member/projects"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/member/time-tracking"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Time Tracking
                </a>
              </li>
              <li>
                <a
                  href="/member/team-chat"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Team Chat
                </a>
              </li>
              <li>
                <a
                  href="/member/profile"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Profile
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Footer - Full width and visible */}
      <footer className="footer-container">
        <SimpleFooter />
      </footer>
    </div>
  );
};

export default MemberHomeLayout;
