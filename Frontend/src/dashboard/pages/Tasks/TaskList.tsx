import React, { useEffect, useState } from "react";
import axios from "axios";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router-dom";

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

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);

  // Check if user is admin
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  // Fetch tasks and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch tasks
        console.log("Fetching tasks...");
        const tasksResponse = await axios.get("http://localhost:5000/tasks");
        console.log("Tasks fetched successfully:", tasksResponse.data);
        setTasks(tasksResponse.data);
        setFilteredTasks(tasksResponse.data);

        // Fetch projects for filtering
        console.log("Fetching projects...");
        const projectsResponse = await axios.get("http://localhost:5000/projects");
        console.log("Projects fetched successfully:", projectsResponse.data);
        setProjects(projectsResponse.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
        toastManager.addToast("Error loading tasks", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    let result = [...tasks];

    if (statusFilter) {
      result = result.filter(task => task.status === statusFilter);
    }

    if (projectFilter) {
      result = result.filter(task => task.projectId._id === projectFilter);
    }

    setFilteredTasks(result);
  }, [tasks, statusFilter, projectFilter]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log("Deleting task with ID:", taskId);

      // Vérifier si l'ID est valide pour MongoDB (24 caractères hexadécimaux)
      const isValidMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

      if (!isValidMongoId(taskId)) {
        console.error("Invalid MongoDB ID format for taskId:", taskId);
        throw new Error("Invalid task ID format");
      }

      await axios.delete(`http://localhost:5000/tasks/${taskId}`);
      console.log("Task deleted successfully via API");

      // Mettre à jour l'interface utilisateur
      setTasks(tasks.filter(task => task._id !== taskId));
      setFilteredTasks(filteredTasks.filter(task => task._id !== taskId));
      toastManager.addToast("Task deleted successfully", "success", 5000);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      console.error("Error details:", err.response?.data);
      console.error("Error stack:", err.stack);
      toastManager.addToast("Error deleting task", "error", 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      case "in-progress":
        return <Badge color="info">In Progress</Badge>;
      case "completed":
        return <Badge color="success">Completed</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading tasks: {error}</div>;
  }

  return (
    <div>
      <PageMeta
        title="Task Management | CodevisionPiweb"
        description="Task Management for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Task Management" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Filters */}
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
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {!isAdmin && (
            <div className="flex items-end ml-auto">
              <Link to="/tasks/create">
                <Button variant="primary">Create New Task</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Task Table */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found. Create a new task to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{task.projectId?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {task.assignedTo?.avatarUrl ? (
                          <img
                            className="h-8 w-8 rounded-full mr-2"
                            src={task.assignedTo.avatarUrl}
                            alt={task.assignedTo.username}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {task.assignedTo?.firstName?.charAt(0) || task.assignedTo?.username?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.assignedTo?.firstName && task.assignedTo?.lastName
                            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                            : task.assignedTo?.username || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!isAdmin ? (
                        <>
                          <Link
                            to={`/tasks/edit/${task._id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">View Only</span>
                      )}
                    </td>
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

export default TaskList;
