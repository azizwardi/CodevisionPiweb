import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import PageMeta from '../../dashboard/components/common/PageMeta';
import PageBreadcrumb from '../../dashboard/components/common/PageBreadCrumb';
import ComponentCard from '../../dashboard/components/common/ComponentCard';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';
import TeamChatInterface from '../components/TeamChatInterface';
import TeamChatNotifications from '../../shared/components/TeamChatNotifications';

interface DecodedToken {
  id: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  teamLeader: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  members: Array<{
    user: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
      role: string;
    };
    skills: Array<{
      skill: string;
      level: number;
    }>;
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const TeamChat: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');

    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        console.log('Decoded token:', decoded);
        setUserId(decoded.id);
      } catch (error) {
        console.error('Error decoding token:', error);
        toastManager.addToast('Error authenticating user', 'error', 5000);
      }
    } else {
      // For testing purposes, set a default user ID if no token is found
      console.log('No token found, using default user ID for testing');
      setUserId('68238df9faf1a556b53543d2'); // Use an ID from your database
      toastManager.addToast('Using test user ID', 'info', 5000);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserTeams();
    }
  }, [userId]);

  const fetchUserTeams = async () => {
    try {
      setLoading(true);
      console.log('Fetching teams for user ID:', userId);

      // Fetch all teams
      console.log('Making API request to: http://localhost:5000/teams');
      const response = await axios.get(`http://localhost:5000/teams`);
      console.log('Teams API response status:', response.status);
      console.log('Teams API response data:', response.data);

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.log('No teams returned from API or invalid response format');
        setTeams([]);
        setLoading(false);
        return;
      }

      // Normalize team data to handle different response formats
      console.log('Normalizing team data...');
      const normalizedTeams = response.data.map((team: any) => {
        console.log('Processing team:', team);

        // Ensure teamLeader is an object
        const teamLeader = typeof team.teamLeader === 'object'
          ? team.teamLeader
          : { _id: team.teamLeader, username: 'Team Leader' };

        console.log('Normalized team leader:', teamLeader);

        // Ensure members is an array of objects
        if (!team.members || !Array.isArray(team.members)) {
          console.log('Team has no members or members is not an array:', team);
          return {
            ...team,
            teamLeader,
            members: []
          };
        }

        const members = team.members.map((member: any) => {
          console.log('Processing member:', member);
          if (typeof member.user === 'object') {
            return member;
          } else {
            return {
              ...member,
              user: { _id: member.user, username: 'Team Member' }
            };
          }
        });

        console.log('Normalized members:', members);

        return {
          ...team,
          teamLeader,
          members
        };
      });

      console.log('All normalized teams:', normalizedTeams);

      // Filter teams where the user is a member or team leader
      const userTeams = normalizedTeams.filter((team: Team) => {
        console.log('Checking if user is in team:', team.name);
        console.log('User ID:', userId);
        console.log('Team leader ID:', team.teamLeader._id);

        const isLeader = team.teamLeader._id === userId;

        // Check if user is a member
        let isMember = false;
        if (team.members && team.members.length > 0) {
          isMember = team.members.some(member => {
            const memberId = member.user._id;
            console.log('Comparing member ID:', memberId, 'with user ID:', userId);
            return memberId === userId;
          });
        }

        console.log('Is leader:', isLeader, 'Is member:', isMember);
        return isLeader || isMember;
      });

      console.log('Filtered user teams:', userTeams);

      // For testing, if no teams are found, use all teams
      if (userTeams.length === 0) {
        console.log('No teams found for user, using all teams for testing');
        setTeams(normalizedTeams);

        // Auto-select the first team if available
        if (normalizedTeams.length > 0 && !selectedTeam) {
          setSelectedTeam(normalizedTeams[0]._id);
        }
      } else {
        setTeams(userTeams);

        // Auto-select the first team if available
        if (userTeams.length > 0 && !selectedTeam) {
          setSelectedTeam(userTeams[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toastManager.addToast('Error fetching teams', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle new message notifications
  const handleNewMessage = (teamId: string, message: any) => {
    // If the message is from a team that's not currently selected, highlight that team
    if (teamId !== selectedTeam) {
      // You could add some visual indication here, like a badge or highlight
      console.log(`New message in team ${teamId} that is not currently selected`);
    }
  };

  return (
    <div>
      <PageMeta
        title="Team Chat | CodevisionPiweb"
        description="Chat with your team members in real-time"
      />
      <PageBreadcrumb pageTitle="Team Chat" />

      {/* Notifications component */}
      {userId && teams.length > 0 && (
        <TeamChatNotifications
          userId={userId}
          teamIds={teams.map(team => team._id)}
          currentTeamId={selectedTeam || undefined}
          onNewMessage={handleNewMessage}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : teams.length === 0 ? (
          <ComponentCard title="No Teams Found">
            <div className="p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                You are not a member of any team yet. Please contact your team leader or administrator.
              </p>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title="Team Chat">
            <div className="flex flex-col md:flex-row h-[calc(100vh-250px)]">
              {/* Team Selector */}
              <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-4">Your Teams</h3>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <button
                      key={team._id}
                      className={`w-full text-left p-2 rounded-lg transition-colors ${
                        selectedTeam === team._id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedTeam(team._id)}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col">
                {selectedTeam ? (
                  <TeamChatInterface
                    teamId={selectedTeam}
                    userId={userId}
                    team={teams.find(t => t._id === selectedTeam)!}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Select a team to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </div>
  );
};

export default TeamChat;
