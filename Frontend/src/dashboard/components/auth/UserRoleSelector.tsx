import { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Popup from '../ui/popup/Popup';

interface JwtPayload {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  googleAuth?: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export default function UserRoleSelector() {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('UserRoleSelector: User from token:', decoded);

      // Check if the user has a role
      const userRole = decoded.role || (decoded.user && decoded.user.role) || '';
      console.log('User role from token:', userRole);

      // Only redirect if the user already has a role
      if (userRole && userRole !== '') {
        console.log('User already has role:', userRole);
        // User already has a role, redirect to appropriate dashboard
        if (userRole === 'admin') {
          navigate('/dashboard');
        } else if (userRole === 'TeamLeader') {
          navigate('/team-leader-dashboard');
        } else if (userRole === 'Member') {
          navigate('/member-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        console.log('User does not have a role, staying on role selection page');
        // Set a default selected role if needed
        if (!role) {
          setRole('Member'); // Default to Member as a suggestion
        }
      }
      // Otherwise, stay on this page to let the user select a role
    } catch (err) {
      console.error('Token decode error:', err);
      localStorage.removeItem('authToken');
      navigate('/signin');
    }
  }, [navigate, role, setRole]);

  const handleSubmit = async () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      console.log('Sending role update request with role:', role);
      const response = await axios.put(
        'http://localhost:5000/api/auth/users/role',
        { role },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Role update response:', response.data);

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userRole', response.data.role);

        // Check if email is verified before redirecting to dashboard
        const decoded = jwtDecode<JwtPayload>(response.data.token);

        // Navigate to the appropriate dashboard based on user role and verification status
        if (decoded.googleAuth || decoded.isVerified) {
          // User is verified (either Google auth or manually verified)
          if (decoded.role === 'admin') {
            // Admin goes to the admin dashboard
            navigate('/dashboard');
          } else if (decoded.role === 'TeamLeader') {
            // Team Leader goes to the team leader dashboard
            navigate('/team-leader-dashboard');
          } else if (decoded.role === 'Member') {
            // Member goes to the member dashboard
            navigate('/member-dashboard');
          } else {
            // Default fallback
            navigate('/dashboard');
          }
        } else {
          // For unverified users, show verification popup and then redirect to signin
          setShowVerificationPopup(true);
        }
      }
    } catch (err) {
      // Handle error with proper type checking
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error updating role:', err);

      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to update role. Please try again.');
      } else {
        setError(errorMessage || 'Failed to update role. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVerificationPopup = () => {
    setShowVerificationPopup(false);
    // Redirect to signin page after showing the verification message
    navigate('/signin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">Select Your Role</h1>
        <p className="text-gray-600 mb-6 text-center">
          Welcome! Please select a role to continue. This will determine your access level in the system.
        </p>

        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
          <p className="font-medium mb-2">You've successfully signed in!</p>
          <p>Before you can access the dashboard, please select your role in the system:</p>
          <ul className="list-disc list-inside mt-2 ml-2">
            <li><strong>Admin:</strong> Full access to all features</li>
            <li><strong>Team Leader:</strong> Manage projects and team members</li>
            <li><strong>Member:</strong> Participate in projects</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <select
          value={role}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setRole(e.target.value);
            setError('');
          }}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a role</option>
          <option value="admin">Admin</option>
          <option value="TeamLeader">Team Leader</option>
          <option value="Member">Member</option>
          <option value="user">User</option>
        </select>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!role || loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium
            ${!role || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Updating...' : 'Confirm Role'}
        </button>
      </div>

      {showVerificationPopup && (
        <Popup
          message="Role selected successfully! You need to verify your email before accessing the dashboard. Please check your inbox for the verification link, then sign in again."
          onClose={handleCloseVerificationPopup}
        />
      )}
    </div>
  );
}
