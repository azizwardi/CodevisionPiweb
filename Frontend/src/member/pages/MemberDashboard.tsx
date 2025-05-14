import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';
import TaskStatusChart from "../../dashboard/components/charts/TaskStatusChart";
import QuizActivityChart from "../../dashboard/components/charts/QuizActivityChart";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority?: 'high' | 'medium' | 'low';
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

interface Announcement {
  id: string;
  title: string;
  date: string;
  author: string;
  authorAvatar: string;
}

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

const MemberDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // États pour les graphiques
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [quizStats, setQuizStats] = useState({
    attempts: 0,
    completed: 0,
    certificates: 0
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
      // Fetch tasks assigned to the user
      const tasksResponse = await axios.get("http://localhost:5000/tasks");
      const userTasks = tasksResponse.data.filter(
        (task: Task) => task.assignedTo?._id === userId
      );
      setTasks(userTasks);

      // Calculate task statistics
      const pendingTasks = userTasks.filter(task => task.status === 'pending').length;
      const inProgressTasks = userTasks.filter(task => task.status === 'in-progress').length;
      const completedTasks = userTasks.filter(task => task.status === 'completed').length;

      // Set task statistics for charts
      setTaskStats({
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      });

      // Fetch projects the user is involved in
      const projectsResponse = await axios.get("http://localhost:5000/projects");
      const userProjects = projectsResponse.data.filter((project: Project) => {
        // Check if user is a team member
        const isTeamMember = project.teamMembers?.some(member => member._id === userId);

        // Check if user has tasks in this project
        const hasTasksInProject = userTasks.some(
          (task: Task) => task.projectId?._id === project._id
        );

        return isTeamMember || hasTasksInProject;
      });
      setProjects(userProjects);

      // Simulate quiz statistics (in a real app, you would fetch these from an API)
      setQuizStats({
        attempts: 12,
        completed: 8,
        certificates: 3
      });

      // For announcements, we'll keep the static data for now
      // In a real application, you would fetch these from an API
      setAnnouncements([
        {
          id: '1',
          title: 'Team Meeting Tomorrow',
          date: new Date().toISOString(),
          author: 'Team Leader',
          authorAvatar: 'https://via.placeholder.com/40'
        },
        {
          id: '2',
          title: 'New Project Starting Next Week',
          date: new Date().toISOString(),
          author: 'Project Manager',
          authorAvatar: 'https://via.placeholder.com/40'
        }
      ]);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      toastManager.addToast("Error loading dashboard data", "error", 5000);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    if (!priority) return 'bg-gray-100 text-gray-800';

    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate progress for a project based on completed tasks
  const calculateProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId?._id === projectId);
    if (projectTasks.length === 0) return 0;

    const completedTasks = projectTasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Member Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <p className="text-2xl font-bold">{taskStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistical charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Task status chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Task Status</h2>
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
                  <span className="text-sm text-gray-500">Pending</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.pending}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">In Progress</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.inProgress}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Completed</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {taskStats.completed}
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz activity chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quiz Activity</h2>
              <div className="h-64">
                <QuizActivityChart
                  published={0} // Not available for members
                  attempts={quizStats.attempts}
                  completed={quizStats.completed}
                  certificates={quizStats.certificates}
                  loading={loading}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Tentatives</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {quizStats.attempts}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Complétés</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {quizStats.completed}
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-sm text-gray-500">Certificats</span>
                  <div className="text-lg font-semibold text-gray-800">
                    {quizStats.certificates}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Espace supplémentaire pour les graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Graphique de progression des tâches par projet */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Progression par projet</h2>
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{project.name}</h3>
                      <span className="text-sm font-medium">{calculateProgress(project._id)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${calculateProgress(project._id)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Aucun projet assigné
                  </div>
                )}
              </div>
            </div>

            {/* Graphique des tâches par priorité */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tâches par priorité</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-red-600 text-xl font-bold">
                      {tasks.filter(task => task.priority === 'high').length}
                    </div>
                    <div className="text-sm text-gray-600">Haute</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-yellow-600 text-xl font-bold">
                      {tasks.filter(task => task.priority === 'medium').length}
                    </div>
                    <div className="text-sm text-gray-600">Moyenne</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-green-600 text-xl font-bold">
                      {tasks.filter(task => task.priority === 'low').length}
                    </div>
                    <div className="text-sm text-gray-600">Basse</div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Tâches à venir</h3>
                  <div className="space-y-2">
                    {tasks.filter(task => new Date(task.dueDate) > new Date()).slice(0, 3).map((task) => (
                      <div key={task._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{task.title}</span>
                        <span className={`px-2 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {tasks.filter(task => new Date(task.dueDate) > new Date()).length === 0 && (
                      <div className="text-center text-gray-500 py-2">
                        Aucune tâche à venir
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MemberDashboard;
