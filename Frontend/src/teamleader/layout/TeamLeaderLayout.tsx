import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import SharedNavbar from '../../shared/components/SharedNavbar';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

const TeamLeaderLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check if user is logged in and has the correct role
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.role !== 'TeamLeader') {
        navigate('/unauthorized');
        return;
      }

      setUser({
        name: decoded.name || '',
        email: decoded.email || ''
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/signin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authChange'));
    navigate('/signin');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Shared Navbar */}
      <SharedNavbar title="Team Leader Portal" bgColor="bg-blue-600" />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white hidden md:block">
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
            </ul>
          </nav>
        </aside>

        {/* Mobile Menu Button */}
        <div className="md:hidden fixed bottom-4 right-4 z-10">
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
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-20 md:hidden">
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
                    href="/profile"
                    className="block py-2 px-4 text-white text-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMenu();
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="block py-2 px-4 text-white text-lg w-full text-left"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Team Leader Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TeamLeaderLayout;
