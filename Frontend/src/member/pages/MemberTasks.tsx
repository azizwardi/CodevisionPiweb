import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
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

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

const MemberTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from token
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

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all tasks
      const tasksResponse = await axios.get("http://localhost:5000/tasks");

      // Filter tasks assigned to the current user
      const userTasks = tasksResponse.data.filter(
        (task: Task) => task.assignedTo?._id === userId
      );

      setTasks(userTasks);
      setFilteredTasks(userTasks);

      // Fetch projects for filtering
      const projectsResponse = await axios.get("http://localhost:5000/projects");
      setProjects(projectsResponse.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      toastManager.addToast("Error loading tasks", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...tasks];
    if (statusFilter) result = result.filter(task => task.status === statusFilter);
    if (projectFilter) result = result.filter(task => task.projectId?._id === projectFilter);
    setFilteredTasks(result);
  }, [tasks, statusFilter, projectFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case "in-progress":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case "completed":
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) return <div className="p-4">Loading tasks...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading tasks: {error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className="block mb-1 text-sm font-medium">Filter by Status</label>
            <select
              className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block mb-1 text-sm font-medium">Filter by Project</label>
            <select
              className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found. You don't have any tasks assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.projectId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {task.assignedTo ? (
                          <>
                            <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                              <img
                                className="h-full w-full object-cover"
                                src={task.assignedTo.avatarUrl ?
                                  (task.assignedTo.avatarUrl.startsWith('http') ? task.assignedTo.avatarUrl :
                                   task.assignedTo.avatarUrl.startsWith('/') ? `http://localhost:5000${task.assignedTo.avatarUrl}` :
                                   `http://localhost:5000/${task.assignedTo.avatarUrl}`) :
                                  "/images/user/owner.jpg"}
                                alt={task.assignedTo.username}
                                onError={(e) => {
                                  // Fallback à l'image par défaut en cas d'erreur
                                  e.currentTarget.src = "/images/user/owner.jpg";
                                }}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.assignedTo.firstName && task.assignedTo.lastName
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                : task.assignedTo.username}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Non assigné</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(task.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberTasks;
