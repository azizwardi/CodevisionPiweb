import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SkillsManager from '../components/skills/SkillsManager';
import RequiredSkillsManager from '../components/skills/RequiredSkillsManager';
import { toastManager } from '../components/ui/toast/ToastContainer';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phoneNumber?: string;
  bio?: string;
  avatar?: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`http://localhost:5000/api/user/showByid/${userId}`);
        setUser(response.data);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to load user data');
        toastManager.addToast('Error loading user data', 'error', 5000);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {user.username}'s Skills
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkillsManager userId={user._id} />
            <RequiredSkillsManager userId={user._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
