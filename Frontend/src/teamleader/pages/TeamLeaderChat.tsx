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

const TeamLeaderChat: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem('token');
    console.log('TeamLeaderChat - Token from localStorage:', token ? 'Token exists' : 'No token found');

    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        console.log('TeamLeaderChat - Decoded token:', decoded);
        setUserId(decoded.id);
      } catch (error) {
        console.error('TeamLeaderChat - Error decoding token:', error);
        toastManager.addToast('Error authenticating user', 'error', 5000);
      }
    } else {
      // For testing purposes, set a default user ID if no token is found
      console.log('TeamLeaderChat - No token found, using default user ID for testing');
      setUserId('67fc4519b843fae99775f911'); // Use the team leader ID from your database
      toastManager.addToast('Using test user ID for team leader', 'info', 5000);
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
      console.log('TeamLeaderChat - Fetching teams for team leader ID:', userId);

      try {
        // Fetch all teams and filter for those where the user is a team leader
        const response = await axios.get(`http://localhost:5000/teams`);
        console.log('TeamLeaderChat - Teams API response status:', response.status);
        console.log('TeamLeaderChat - Teams API response data:', response.data);

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          console.log('TeamLeaderChat - No teams returned from API or invalid response format');
          // Create a test team for debugging
          createTestTeam();
          return;
        }

        // Normalize team data to handle different response formats
        console.log('TeamLeaderChat - Normalizing team data...');
        const normalizedTeams = response.data.map((team: any) => {
          console.log('TeamLeaderChat - Processing team:', team);

          // Ensure teamLeader is an object
          const teamLeader = typeof team.teamLeader === 'object'
            ? team.teamLeader
            : { _id: team.teamLeader, username: 'Team Leader' };

          console.log('TeamLeaderChat - Normalized team leader:', teamLeader);

          // Ensure members is an array of objects
          if (!team.members || !Array.isArray(team.members)) {
            console.log('TeamLeaderChat - Team has no members or members is not an array:', team);
            return {
              ...team,
              teamLeader,
              members: []
            };
          }

          const members = team.members.map((member: any) => {
            console.log('TeamLeaderChat - Processing member:', member);
            if (typeof member.user === 'object') {
              return member;
            } else {
              return {
                ...member,
                user: { _id: member.user, username: 'Team Member' }
              };
            }
          });

          console.log('TeamLeaderChat - Normalized members:', members);

          return {
            ...team,
            teamLeader,
            members
          };
        });

        console.log('TeamLeaderChat - All normalized teams:', normalizedTeams);

        // Filter teams where the user is a team leader
        const leaderTeams = normalizedTeams.filter((team: Team) => {
          console.log('TeamLeaderChat - Checking if user is team leader of:', team.name);
          console.log('TeamLeaderChat - User ID:', userId);
          console.log('TeamLeaderChat - Team leader ID:', team.teamLeader._id);

          const isLeader = team.teamLeader._id === userId;
          console.log('TeamLeaderChat - Is leader:', isLeader);
          return isLeader;
        });

        console.log('TeamLeaderChat - Filtered leader teams:', leaderTeams);

        // For testing, if no teams are found, use all teams
        if (leaderTeams.length === 0) {
          console.log('TeamLeaderChat - No teams found where user is leader, using all teams for testing');
          setTeams(normalizedTeams);

          // Auto-select the first team if available
          if (normalizedTeams.length > 0 && !selectedTeam) {
            setSelectedTeam(normalizedTeams[0]._id);
          } else {
            // Create a test team if no teams are available
            createTestTeam();
          }
        } else {
          setTeams(leaderTeams);

          // Auto-select the first team if available
          if (leaderTeams.length > 0 && !selectedTeam) {
            setSelectedTeam(leaderTeams[0]._id);
          }
        }
      } catch (apiError) {
        console.error('TeamLeaderChat - API error fetching teams:', apiError);
        // Create a test team for debugging
        createTestTeam();
      }
    } catch (error) {
      console.error('TeamLeaderChat - Error in fetchUserTeams function:', error);
      toastManager.addToast('Error fetching teams', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  // Function to create a test team for debugging
  const createTestTeam = () => {
    console.log('TeamLeaderChat - Creating test team for debugging');
    const testTeam: Team = {
      _id: '68239303dfc0938534f1c24c', // Use a valid team ID from your database if possible
      name: 'Test Team',
      description: 'This is a test team for debugging',
      teamLeader: {
        _id: userId,
        username: 'Team Leader',
        firstName: 'Team',
        lastName: 'Leader',
        email: 'leader@example.com'
      },
      members: [
        {
          user: {
            _id: '68238df9faf1a556b53543d2', // Use a valid member ID from your database
            username: 'Team Member',
            firstName: 'Team',
            lastName: 'Member',
            email: 'member@example.com',
            role: 'Member'
          },
          skills: [],
          addedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTeams([testTeam]);
    setSelectedTeam(testTeam._id);
    console.log('TeamLeaderChat - Test team created:', testTeam);
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
                You are not a leader of any team yet. Please create a team first.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                onClick={() => createTestTeam()}
              >
                Create Test Team
              </button>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title="Team Chat">
            <div className="flex flex-col md:flex-row h-[calc(100vh-300px)]">
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
                {selectedTeam && teams.find(t => t._id === selectedTeam) ? (
                  <TeamChatInterface
                    teamId={selectedTeam}
                    userId={userId}
                    team={teams.find(t => t._id === selectedTeam)!}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-gray-500 mb-4">
                      {selectedTeam
                        ? 'Selected team not found in teams list'
                        : 'Select a team to start chatting'}
                    </p>
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

export default TeamLeaderChat;
