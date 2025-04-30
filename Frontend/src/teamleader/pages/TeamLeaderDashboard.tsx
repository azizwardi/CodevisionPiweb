import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isVerified: boolean;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: User;
  projectId: Project;
  dueDate: string;
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  teamMembers: User[];
  teamLeader: User;
}

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

interface TeamMember {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatarUrl?: string;
  tasksCompleted: number;
  tasksTotal: number;
  status: 'online' | 'offline' | 'away';
}

const TeamLeaderDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const id = decoded.user?.id || decoded.id;
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setError("Authentication error");
      }
    }
  }, []);

  // Fetch data when userId is available
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all users
      const usersResponse = await axios.get("http://localhost:5000/api/user/showuser");

      // Fetch all tasks
      const tasksResponse = await axios.get("http://localhost:5000/tasks");
      setTasks(tasksResponse.data);

      // Fetch all projects
      const projectsResponse = await axios.get("http://localhost:5000/projects");

      // Filter projects where the current user is the team leader
      const leaderProjects = projectsResponse.data.filter(
        (project: Project) => project.teamLeader?._id === userId
      );
      setProjects(leaderProjects);

      // Process team members data
      const teamMembersData: TeamMember[] = [];
      const teamMemberIds = new Set<string>();

      // Add team members from projects
      leaderProjects.forEach((project: Project) => {
        project.teamMembers?.forEach((member: User) => {
          if (!teamMemberIds.has(member._id)) {
            teamMemberIds.add(member._id);

            // Count tasks for this member
            const memberTasks = tasksResponse.data.filter(
              (task: Task) => task.assignedTo?._id === member._id
            );
            const completedTasks = memberTasks.filter(
              (task: Task) => task.status === 'completed'
            ).length;

            // Add to team members array
            teamMembersData.push({
              _id: member._id,
              username: member.username,
              firstName: member.firstName,
              lastName: member.lastName,
              role: member.role || "Team Member",
              avatarUrl: member.avatarUrl,
              tasksCompleted: completedTasks,
              tasksTotal: memberTasks.length,
              status: Math.random() > 0.5 ? 'online' : 'offline' // Random status for demo
            });
          }
        });
      });

      setTeamMembers(teamMembersData);

      // Calculate upcoming deadlines (projects with deadlines in the next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const upcoming = leaderProjects.filter((project: Project) => {
        const endDate = new Date(project.endDate);
        return endDate >= today && endDate <= nextWeek;
      }).length;

      setUpcomingDeadlines(upcoming);

      // Calculate overall progress
      if (leaderProjects.length > 0) {
        const totalTasks = tasksResponse.data.filter(
          (task: Task) => leaderProjects.some((project: Project) => project._id === task.projectId?._id)
        );

        if (totalTasks.length > 0) {
          const completedTasks = totalTasks.filter((task: Task) => task.status === 'completed').length;
          setOverallProgress(Math.round((completedTasks / totalTasks.length) * 100));
        }
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      toastManager.addToast("Error loading dashboard data", "error", 5000);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'at-risk':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'delayed':
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberStatusColor = (status: 'online' | 'offline' | 'away') => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate progress for a project based on completed tasks
  const calculateProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId?._id === projectId);
    if (projectTasks.length === 0) return 0;

    const completedTasks = projectTasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team Leader Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Team Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Upcoming Deadlines</p>
                  <p className="text-2xl font-bold">{upcomingDeadlines}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Team Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No team members found. Add members to your projects to see them here.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((member) => (
                      <tr key={member._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={member.avatarUrl || "https://via.placeholder.com/40"}
                                alt={member.username}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.firstName && member.lastName
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full ${getMemberStatusColor(member.status)} mr-2`}></div>
                            <span className="text-sm text-gray-500 capitalize">{member.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.tasksCompleted} / {member.tasksTotal}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${member.tasksTotal > 0 ? (member.tasksCompleted / member.tasksTotal) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Active Projects</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No projects found. Create new projects to see them here.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr key={project._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(project.endDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${calculateProjectProgress(project._id)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{calculateProjectProgress(project._id)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamLeaderDashboard;
