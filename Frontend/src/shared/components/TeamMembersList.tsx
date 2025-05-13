import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface TeamMember {
  user: User;
  skills: Array<{
    skill: string;
    level: number;
  }>;
  addedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  teamLeader: User;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface TeamMembersListProps {
  team: Team;
  currentUserId: string;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({ team, currentUserId }) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to socket.io to track online users
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for online status tracking');
      // Join the team room
      newSocket.emit('joinTeam', team._id);
      // Announce presence
      newSocket.emit('userOnline', { userId: currentUserId, teamId: team._id });
    });

    newSocket.on('onlineUsers', (users: string[]) => {
      console.log('Online users update received:', users);
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('userOffline', { userId: currentUserId, teamId: team._id });
        newSocket.disconnect();
      }
    };
  }, [team._id, currentUserId]);

  // Get all team members including the leader
  const allMembers = [
    { user: team.teamLeader, role: 'Team Leader' },
    ...team.members.map(member => ({
      user: member.user,
      role: member.user.role || 'Member'
    }))
  ];

  // Helper function to get user display name
  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };



  return (
    <div className="p-4">
      <div className="space-y-4">
        {allMembers.map((member, index) => {
          const isCurrentUser = member.user._id === currentUserId;
          const isOnline = onlineUsers.includes(member.user._id);
          const isLeader = member.role === 'Team Leader';

          return (
            <div
              key={`${member.user._id}-${index}`}
              className={`flex items-center p-3 rounded-xl transition-all ${
                isCurrentUser
                  ? 'bg-primary/5 border border-primary/20'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="relative mr-3">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={getUserDisplayName(member.user)}
                    className={`w-10 h-10 rounded-full object-cover ${
                      isLeader ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    isLeader
                      ? 'bg-primary ring-2 ring-primary ring-offset-2'
                      : 'bg-gray-400 dark:bg-gray-600'
                  }`}>
                    {getUserDisplayName(member.user).charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                    isOnline
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getUserDisplayName(member.user)}
                  </span>
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isLeader ? (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Team Leader
                    </span>
                  ) : (
                    <span>{member.role}</span>
                  )}
                  <span className="mx-2">•</span>
                  <span className={isOnline ? 'text-green-500' : ''}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMembersList;
