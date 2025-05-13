import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';
import TaskStatusChart from "../../dashboard/components/charts/TaskStatusChart";
import ProjectStatusChart from "../../dashboard/components/charts/ProjectStatusChart";
import TeamMembersPerformanceChart from "../../dashboard/components/charts/TeamMembersPerformanceChart";
import TeamSkillsChart from "../../dashboard/components/charts/TeamSkillsChart";

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

// Type pour les membres d'équipe pour le graphique
interface ChartTeamMember {
  name: string;
  tasksCompleted: number;
  tasksTotal: number;
  performancePercentage: number;
}

// Type pour les compétences
interface Skill {
  name: string;
  level: number;
}

const TeamLeaderDashboard: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);

  // États pour les graphiques
  const [chartTeamMembers, setChartTeamMembers] = useState<ChartTeamMember[]>([]);
  const [teamSkills, setTeamSkills] = useState<Skill[]>([]);
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [projectStats, setProjectStats] = useState({
    active: 0,
    completed: 0
  });

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
        toastManager.addToast("Erreur d'authentification", "error", 5000);
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

    try {
      console.log("Fetching data for team leader dashboard...");
      console.log("User ID:", userId);

      // Récupérer les statistiques du dashboard depuis l'API
      const dashboardResponse = await axios.get(`http://localhost:5000/dashboard/team-leader/${userId}`);
      console.log("Dashboard stats:", dashboardResponse.data);

      // Fetch all tasks
      const tasksResponse = await axios.get("http://localhost:5000/tasks");
      console.log("Tasks data:", tasksResponse.data);
      setTasks(tasksResponse.data);

      // Fetch all projects
      const projectsResponse = await axios.get("http://localhost:5000/projects");
      console.log("Projects data:", projectsResponse.data);

      // Filter projects where the current user is the team leader
      const leaderProjects = projectsResponse.data.filter(
        (project: Project) => project.teamLeader?._id === userId
      );
      console.log("Leader projects:", leaderProjects);
      setProjects(leaderProjects);

      // Fetch teams for this team leader
      const teamsResponse = await axios.get(`http://localhost:5000/teams/leader/${userId}`);
      console.log("Teams data:", teamsResponse.data);

      // Process team members data
      const teamMembersData: TeamMember[] = [];
      const teamMemberIds = new Set<string>();

      // Add team members from projects
      leaderProjects.forEach((project: Project) => {
        if (project.teamMembers && project.teamMembers.length > 0) {
          project.teamMembers.forEach((member: User) => {
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
                status: Math.random() > 0.5 ? 'online' : 'offline' // Statut aléatoire pour la démo
              });
            }
          });
        }
      });

      // Add team members from teams if available
      if (teamsResponse.data && teamsResponse.data.length > 0) {
        teamsResponse.data.forEach((team: any) => {
          if (team.members && team.members.length > 0) {
            team.members.forEach((memberObj: any) => {
              const member = memberObj.user;
              if (member && !teamMemberIds.has(member._id)) {
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
                  status: Math.random() > 0.5 ? 'online' : 'offline' // Statut aléatoire pour la démo
                });
              }
            });
          }
        });
      }

      console.log("Team members data:", teamMembersData);
      setTeamMembers(teamMembersData);

      // Préparer les données pour le graphique de performance des membres
      const chartMembers: ChartTeamMember[] = teamMembersData.map(member => {
        const name = member.firstName && member.lastName
          ? `${member.firstName} ${member.lastName}`
          : member.username;
        const performancePercentage = member.tasksTotal > 0
          ? Math.round((member.tasksCompleted / member.tasksTotal) * 100)
          : 0;

        return {
          name,
          tasksCompleted: member.tasksCompleted,
          tasksTotal: member.tasksTotal,
          performancePercentage
        };
      });
      setChartTeamMembers(chartMembers);

      // Récupérer les compétences de l'équipe depuis les équipes
      let teamSkillsData: Skill[] = [];

      if (teamsResponse.data && teamsResponse.data.length > 0) {
        // Créer un map pour agréger les niveaux de compétence
        const skillsMap = new Map<string, number[]>();

        teamsResponse.data.forEach((team: any) => {
          if (team.members && team.members.length > 0) {
            team.members.forEach((memberObj: any) => {
              if (memberObj.skills && memberObj.skills.length > 0) {
                memberObj.skills.forEach((skill: any) => {
                  const skillName = skill.skill;
                  const skillLevel = skill.level;

                  if (!skillsMap.has(skillName)) {
                    skillsMap.set(skillName, []);
                  }
                  skillsMap.get(skillName)?.push(skillLevel);
                });
              }
            });
          }
        });

        // Calculer la moyenne des niveaux de compétence
        skillsMap.forEach((levels, name) => {
          const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
          teamSkillsData.push({
            name,
            level: Math.round(avgLevel * 20) // Convertir de 1-5 à 0-100
          });
        });
      }

      // Si aucune compétence n'est trouvée, utiliser des données de démonstration
      if (teamSkillsData.length === 0) {
        teamSkillsData = [
          { name: 'React', level: 85 },
          { name: 'Node.js', level: 75 },
          { name: 'TypeScript', level: 70 },
          { name: 'MongoDB', level: 65 },
          { name: 'Express', level: 80 },
        ];
      }

      setTeamSkills(teamSkillsData);

      // Utiliser les statistiques du dashboard si disponibles, sinon calculer
      if (dashboardResponse.data) {
        const stats = dashboardResponse.data;

        // Mettre à jour les statistiques des tâches
        setTaskStats({
          pending: stats.tasks.pending,
          inProgress: stats.tasks.inProgress,
          completed: stats.tasks.completed
        });

        // Mettre à jour les statistiques des projets
        setProjectStats({
          active: stats.projects.active,
          completed: stats.projects.completed
        });

        // Calculer le progrès global
        const totalTasks = stats.tasks.total;
        const completedTasks = stats.tasks.completed;
        const overallProgressValue = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;
        setOverallProgress(overallProgressValue);

        // Définir les deadlines à venir si disponibles
        if (stats.upcomingDeadlines !== undefined) {
          setUpcomingDeadlines(stats.upcomingDeadlines);
        } else {
          // Calculer les deadlines à venir (projets avec des échéances dans les 7 prochains jours)
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          const upcoming = leaderProjects.filter((project: Project) => {
            const endDate = new Date(project.endDate);
            return endDate >= today && endDate <= nextWeek;
          }).length;

          setUpcomingDeadlines(upcoming);
        }
      } else {
        // Calculer manuellement si les statistiques du dashboard ne sont pas disponibles
        const today = new Date();

        // Calculer les statistiques des projets
        const activeProjects = leaderProjects.filter((project: Project) => new Date(project.endDate) > today).length;
        const completedProjects = leaderProjects.filter((project: Project) => new Date(project.endDate) <= today).length;

        setProjectStats({
          active: activeProjects,
          completed: completedProjects
        });

        // Calculer les statistiques des tâches
        const projectIds = leaderProjects.map((project: Project) => project._id);
        const projectTasks = tasksResponse.data.filter(
          (task: Task) => projectIds.includes(task.projectId?._id)
        );

        const pendingTasks = projectTasks.filter((task: Task) => task.status === 'pending').length;
        const inProgressTasks = projectTasks.filter((task: Task) => task.status === 'in-progress').length;
        const completedTasks = projectTasks.filter((task: Task) => task.status === 'completed').length;
        const totalTasksCount = projectTasks.length;

        setTaskStats({
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks
        });

        // Calculer le progrès global
        const overallProgressValue = totalTasksCount > 0
          ? Math.round((completedTasks / totalTasksCount) * 100)
          : 0;
        setOverallProgress(overallProgressValue);

        // Calculer les deadlines à venir
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcoming = leaderProjects.filter((project: Project) => {
          const endDate = new Date(project.endDate);
          return endDate >= today && endDate <= nextWeek;
        }).length;

        setUpcomingDeadlines(upcoming);
      }

      console.log("Task stats:", taskStats);
      console.log("Project stats:", projectStats);
      console.log("Overall progress:", overallProgress);
      console.log("Upcoming deadlines:", upcomingDeadlines);

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      toastManager.addToast("Erreur lors du chargement des données du tableau de bord", "error", 5000);
      setLoading(false);
    }
  };

  // Fonction pour obtenir la couleur en fonction du statut
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

  // Fonction pour obtenir la couleur en fonction du statut du membre
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

          {/* Graphiques statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Graphique de performance des membres */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance de l'équipe</h2>
              <div className="h-64">
                <TeamMembersPerformanceChart
                  teamMembers={chartTeamMembers}
                  loading={loading}
                />
              </div>
            </div>

            {/* Graphique des compétences de l'équipe */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Compétences de l'équipe</h2>
              <div className="h-64">
                <TeamSkillsChart
                  skills={teamSkills}
                  loading={loading}
                />
              </div>
            </div>

            {/* Graphique de statut des tâches */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">État des tâches</h2>
              <div className="h-64">
                <TaskStatusChart
                  pending={taskStats.pending}
                  inProgress={taskStats.inProgress}
                  completed={taskStats.completed}
                  loading={loading}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">En attente</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.pending}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">En cours</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.inProgress}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Terminées</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.completed}
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique de statut des projets */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">État des projets</h2>
              <div className="h-64">
                <ProjectStatusChart
                  active={projectStats.active}
                  completed={projectStats.completed}
                  loading={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Actifs</span>
                  <div className="text-xl font-semibold text-gray-800">
                    {projectStats.active}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Terminés</span>
                  <div className="text-xl font-semibold text-gray-800">
                    {projectStats.completed}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tâches par membre */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Membres par Performance</h2>
              <div className="space-y-4">
                {teamMembers.slice(0, 5).sort((a, b) => {
                  const aPerformance = a.tasksTotal > 0 ? (a.tasksCompleted / a.tasksTotal) * 100 : 0;
                  const bPerformance = b.tasksTotal > 0 ? (b.tasksCompleted / b.tasksTotal) * 100 : 0;
                  return bPerformance - aPerformance;
                }).map((member) => (
                  <div key={member._id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 relative">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={member.avatarUrl || "https://via.placeholder.com/40"}
                        alt={member.username}
                      />
                      <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${getMemberStatusColor(member.status)}`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.tasksTotal > 0 ? (member.tasksCompleted / member.tasksTotal) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {member.tasksTotal > 0 ? Math.round((member.tasksCompleted / member.tasksTotal) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Aucun membre d'équipe trouvé
                  </div>
                )}
              </div>
            </div>

            {/* Projets à venir */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Projets à venir</h2>
              <div className="space-y-4">
                {projects.filter(project => new Date(project.endDate) > new Date()).slice(0, 5).map((project) => (
                  <div key={project._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <h3 className="font-medium">{project.name}</h3>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(project.status || 'in-progress')}`}>
                          {project.status || 'En cours'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${calculateProjectProgress(project._id)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{calculateProjectProgress(project._id)}%</span>
                    </div>
                  </div>
                ))}
                {projects.filter(project => new Date(project.endDate) > new Date()).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Aucun projet à venir
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Résumé des tâches */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Résumé des tâches par statut</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-yellow-700 font-medium">En attente</h3>
                  <span className="text-2xl font-bold text-yellow-700">{taskStats.pending}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Tâches qui n'ont pas encore été commencées
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-blue-700 font-medium">En cours</h3>
                  <span className="text-2xl font-bold text-blue-700">{taskStats.inProgress}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Tâches actuellement en cours de réalisation
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-green-700 font-medium">Terminées</h3>
                  <span className="text-2xl font-bold text-green-700">{taskStats.completed}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Tâches qui ont été complétées avec succès
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamLeaderDashboard;
