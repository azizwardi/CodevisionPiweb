import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface User {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface SharedNavbarProps {
  title: string;
  bgColor: string;
}

const SharedNavbar: React.FC<SharedNavbarProps> = ({ title, bgColor }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUser({
          name: decoded.name || '',
          email: decoded.email || '',
          role: decoded.role || '',
          avatarUrl: localStorage.getItem('userAvatarUrl') || '/images/user/owner.jpg'
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new Event('authChange'));
    navigate('/signin');
  };

  return (
    <header className={`${bgColor} text-white shadow-md`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="flex items-center">
          <div className="hidden md:flex items-center mr-4">
            {user && (
              <span className="mr-2">{user.name}</span>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={toggleDropdown}
              className="flex items-center focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">Role: {user?.role}</p>
                </div>
                <a
                  href="/profile"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDropdownOpen(false);
                    // Redirect to admin dashboard profile
                    navigate('/profile');
                  }}
                >
                  Profile
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SharedNavbar;
