import React, { useEffect, useState } from "react";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Button from "../../dashboard/components/ui/button/Button";
import Badge from "../../dashboard/components/ui/badge/Badge";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import CreateTaskForm from "../../teamleader/pages/CreateTask"; 

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
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const tasksResponse = await axios.get("http://localhost:5000/tasks");
        setTasks(tasksResponse.data);
        setFilteredTasks(tasksResponse.data);

        const projectsResponse = await axios.get("http://localhost:5000/projects");
        setProjects(projectsResponse.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        toastManager.addToast("Error loading tasks", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...tasks];
    if (statusFilter) result = result.filter(task => task.status === statusFilter);
    if (projectFilter) result = result.filter(task => task.projectId._id === projectFilter);
    setFilteredTasks(result);
  }, [tasks, statusFilter, projectFilter]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      const isValidMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);
      if (!isValidMongoId(taskId)) throw new Error("Invalid task ID format");

      await axios.delete(`http://localhost:8000/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
      setFilteredTasks(filteredTasks.filter(task => task._id !== taskId));
      toastManager.addToast("Task deleted successfully", "success", 5000);
    } catch (err: any) {
      toastManager.addToast("Error deleting task", "error", 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge color="warning">Pending</Badge>;
      case "in-progress": return <Badge color="info">In Progress</Badge>;
      case "completed": return <Badge color="success">Completed</Badge>;
      default: return <Badge color="light">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-4">Loading tasks...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading tasks: {error}</div>;

  return (
    <div>
      <PageMeta title="Task Management | CodevisionPiweb" description="Task Management for CodevisionPiweb" />
      <PageBreadcrumb pageTitle="Task Management" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className="block mb-1 text-sm font-medium">Filter by Status</label>
            <select className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block mb-1 text-sm font-medium">Filter by Project</label>
            <select className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end ml-auto">
            <Button variant="primary" onClick={() => setShowCreatePopup(true)}>Create New Task</Button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found. Create a new task to get started.</p>
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">{task.assignedTo?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDeleteTask(task._id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup Modal for Create Task */}
      {showCreatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative">
            <button onClick={() => setShowCreatePopup(false)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500">&times;</button>
            <CreateTaskForm onClose={() => setShowCreatePopup(false)} onTaskCreated={newTask => setTasks([...tasks, newTask])} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
