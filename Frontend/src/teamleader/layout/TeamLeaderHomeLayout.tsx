import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import SharedNavbar from '../../shared/components/SharedNavbar';
import FullFooter from '../../shared/components/FullFooter';
import '../../styles/layouts.css';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const TeamLeaderHomeLayout: React.FC = () => {
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="layout-container">
      {/* Navbar - scrolls with the page */}
      <div className="navbar-container">
        <SharedNavbar title="Dashboard" bgColor="bg-white" />
      </div>

      {/* Main content with sidebar */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar hidden md:block">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/team-leader-dashboard"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/team"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  My Team
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/projects"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/tasks"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Tasks
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/reports"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Reports
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/profile"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/assistant"
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  Assistant IA
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
                  href="/team-leader-dashboard"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/team"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  My Team
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/projects"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/tasks"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Tasks
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/reports"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Reports
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/profile"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  href="/team-leader/assistant"
                  className="block py-2 px-4 text-white text-lg"
                  onClick={toggleMenu}
                >
                  Assistant IA
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Footer - Full width and visible */}
      <FullFooter />
    </div>
  );
};

export default TeamLeaderHomeLayout;
