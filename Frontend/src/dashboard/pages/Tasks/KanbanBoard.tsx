import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import "./KanbanBoard.css";

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
  taskType: string;
  assignedTo: User;
  projectId: Project;
  dueDate: string;
  createdAt: string;
  priority: string;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface KanbanData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
}

const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  
  const [data, setData] = useState<KanbanData>({
    tasks: {},
    columns: {
      "no-status": {
        id: "no-status",
        title: "No Status",
        taskIds: [],
      },
      backlog: {
        id: "backlog",
        title: "Backlog",
        taskIds: [],
      },
      todo: {
        id: "todo",
        title: "To Do",
        taskIds: [],
      },
      "in-progress": {
        id: "in-progress",
        title: "In Progress",
        taskIds: [],
      },
      "in-review": {
        id: "in-review",
        title: "In Review",
        taskIds: [],
      },
      completed: {
        id: "completed",
        title: "Completed",
        taskIds: [],
      },
    },
    columnOrder: ["no-status", "backlog", "todo", "in-progress", "in-review", "completed"],
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch tasks and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Déterminer les endpoints en fonction du rôle de l'utilisateur
        const userRole = localStorage.getItem("userRole");
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");
        
        if (!token) {
          throw new Error("No authentication token found");
        }
        
        const headers = {
          Authorization: `Bearer ${token}`
        };
        
        let tasksEndpoint = "http://localhost:5000/tasks";
        const projectsEndpoint = "http://localhost:5000/projects";
        
        // Si l'utilisateur est un membre, récupérer uniquement ses tâches
        if (userRole?.toLowerCase() === "member" && userId) {
          tasksEndpoint = `http://localhost:5000/tasks/user/${userId}`;
        }
        
        // Fetch tasks
        console.log(`Fetching tasks from ${tasksEndpoint}...`);
        const tasksResponse = await axios.get(tasksEndpoint, { headers });
        console.log("Tasks fetched successfully:", tasksResponse.data);
        
        // Fetch projects for filtering
        console.log(`Fetching projects from ${projectsEndpoint}...`);
        const projectsResponse = await axios.get(projectsEndpoint, { headers });
        console.log("Projects fetched successfully:", projectsResponse.data);
        setProjects(projectsResponse.data);

        // Process tasks for Kanban board
        const tasks = tasksResponse.data;
        const tasksById: { [key: string]: Task } = {};
        const columns = { ...data.columns };

        // Reset taskIds in all columns
        Object.keys(columns).forEach(columnId => {
          columns[columnId].taskIds = [];
        });

        // Distribute tasks to columns based on status
        tasks.forEach((task: Task) => {
          tasksById[task._id] = task;
          
          // If task has a status that matches a column, add it to that column
          if (columns[task.status]) {
            columns[task.status].taskIds.push(task._id);
          } else {
            // If status doesn't match any column, add to "no-status"
            columns["no-status"].taskIds.push(task._id);
          }
        });

        // Update state with processed data
        setData({
          tasks: tasksById,
          columns,
          columnOrder: data.columnOrder,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        console.error("Error fetching data:", err);
        setError(errorMessage);
        toastManager.addToast("Error loading tasks", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks by project
  useEffect(() => {
    if (!loading && projectFilter) {
      const fetchData = async () => {
        try {
          // Fetch tasks for the selected project
          const token = localStorage.getItem("authToken");
          if (!token) {
            throw new Error("No authentication token found");
          }
          
          const headers = {
            Authorization: `Bearer ${token}`
          };
          
          const tasksResponse = await axios.get(`http://localhost:5000/tasks/project/${projectFilter}`, { headers });
          console.log("Project tasks fetched successfully:", tasksResponse.data);
          
          // Process tasks for Kanban board
          const tasks = tasksResponse.data;
          const tasksById: { [key: string]: Task } = {};
          const columns = { ...data.columns };

          // Reset taskIds in all columns
          Object.keys(columns).forEach(columnId => {
            columns[columnId].taskIds = [];
          });

          // Distribute tasks to columns based on status
          tasks.forEach((task: Task) => {
            tasksById[task._id] = task;
            
            // If task has a status that matches a column, add it to that column
            if (columns[task.status]) {
              columns[task.status].taskIds.push(task._id);
            } else {
              // If status doesn't match any column, add to "no-status"
              columns["no-status"].taskIds.push(task._id);
            }
          });

          // Update state with processed data
          setData({
            tasks: tasksById,
            columns,
            columnOrder: data.columnOrder,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Error fetching project tasks";
          console.error("Error fetching project tasks:", err);
          toastManager.addToast(errorMessage, "error", 5000);
        }
      };

      fetchData();
    } else if (!loading && !projectFilter) {
      // If project filter is cleared, fetch all tasks again
      const fetchAllTasks = async () => {
        try {
          const token = localStorage.getItem("authToken");
          if (!token) {
            throw new Error("No authentication token found");
          }
          
          const headers = {
            Authorization: `Bearer ${token}`
          };
          
          const userRole = localStorage.getItem("userRole");
          const userId = localStorage.getItem("userId");
          
          let tasksEndpoint = "http://localhost:5000/tasks";
          
          // Si l'utilisateur est un membre, récupérer uniquement ses tâches
          if (userRole?.toLowerCase() === "member" && userId) {
            tasksEndpoint = `http://localhost:5000/tasks/user/${userId}`;
          }
          
          const tasksResponse = await axios.get(tasksEndpoint, { headers });
          
          // Process tasks for Kanban board
          const tasks = tasksResponse.data;
          const tasksById: { [key: string]: Task } = {};
          const columns = { ...data.columns };

          // Reset taskIds in all columns
          Object.keys(columns).forEach(columnId => {
            columns[columnId].taskIds = [];
          });

          // Distribute tasks to columns based on status
          tasks.forEach((task: Task) => {
            tasksById[task._id] = task;
            
            if (columns[task.status]) {
              columns[task.status].taskIds.push(task._id);
            } else {
              columns["no-status"].taskIds.push(task._id);
            }
          });

          // Update state with processed data
          setData({
            tasks: tasksById,
            columns,
            columnOrder: data.columnOrder,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Error fetching all tasks";
          console.error("Error fetching all tasks:", err);
          toastManager.addToast(errorMessage, "error", 5000);
        }
      };

      fetchAllTasks();
    }
  }, [projectFilter]);

  // Fonction pour changer le statut d'une tâche
  const changeTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = data.tasks[taskId];
      const updatedTask = { ...task, status: newStatus };
      
      // Mettre à jour la tâche dans la base de données
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      await axios.put(`http://localhost:5000/tasks/${taskId}`, updatedTask, { headers });
      console.log(`Task ${taskId} status updated to ${newStatus}`);
      
      // Mettre à jour l'état local
      const columns = { ...data.columns };
      
      // Trouver la colonne actuelle de la tâche
      const currentColumnId = Object.keys(columns).find(columnId => 
        columns[columnId].taskIds.includes(taskId)
      );
      
      if (currentColumnId) {
        // Retirer la tâche de sa colonne actuelle
        columns[currentColumnId].taskIds = columns[currentColumnId].taskIds.filter(id => id !== taskId);
        
        // Ajouter la tâche à sa nouvelle colonne
        columns[newStatus].taskIds.push(taskId);
        
        // Mettre à jour l'état des colonnes
        setData(prevData => ({
          ...prevData,
          columns,
          tasks: {
            ...prevData.tasks,
            [taskId]: {
              ...prevData.tasks[taskId],
              status: newStatus,
            },
          },
        }));
        
        toastManager.addToast(`Task moved to ${data.columns[newStatus].title}`, "success");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error updating task status";
      console.error("Error updating task status:", err);
      toastManager.addToast(errorMessage, "error");
    }
  };

  const getTaskTypeBadge = (taskType: string) => {
    let color: "primary" | "info" | "warning" | "light" | "error" | "success" = "light";
    
    switch (taskType) {
      case "development":
        color = "primary";
        break;
      case "design":
        color = "info";
        break;
      case "testing":
        color = "warning";
        break;
      case "documentation":
        color = "light";
        break;
      case "bug-fix":
        color = "error";
        break;
      case "feature":
        color = "success";
        break;
      case "JAVA":
        color = "primary";
        break;
      case "DEVOPS":
        color = "info";
        break;
      case "JS":
        color = "warning";
        break;
      default:
        color = "light";
    }
    
    return <Badge size="sm" color={color}>{taskType}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    let color: "primary" | "info" | "warning" | "light" | "error" | "success" = "light";
    
    switch (priority) {
      case "high":
        color = "error";
        break;
      case "medium":
        color = "warning";
        break;
      case "low":
        color = "success";
        break;
      default:
        color = "light";
    }
    
    return <Badge size="sm" color={color}>{priority}</Badge>;
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
        title="Kanban Board | CodevisionPiweb"
        description="Kanban Board for Task Management"
      />
      <PageBreadcrumb pageTitle="Kanban Board" />

      <div className="mb-6 flex flex-wrap gap-4 items-center">
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

        <div className="flex items-end ml-auto">
          <Link to="/tasks/create">
            <Button variant="primary">Create New Task</Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => {
              // Déterminer la redirection en fonction du rôle de l'utilisateur
              const userRole = localStorage.getItem("userRole");
              if (userRole?.toLowerCase() === "teamleader") {
                window.location.href = "/team-leader/tasks";
              } else if (userRole?.toLowerCase() === "member") {
                window.location.href = "/member/tasks";
              } else {
                window.location.href = "/tasks";
              }
            }}
          >
            List View
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 space-x-4">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 column-container">
                <h3 className="font-semibold text-lg flex items-center justify-between column-header">
                  {column.title}
                  <span className="task-count">
                    {column.taskIds.length}
                  </span>
                </h3>

                <div className="task-list">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow mb-3 cursor-pointer task-card"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        <div className="flex space-x-1">
                          <div className="relative status-menu-trigger">
                            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 status-menu">
                              {data.columnOrder.map(colId => (
                                colId !== task.status && (
                                  <button
                                    key={colId}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => changeTaskStatus(task._id, colId)}
                                  >
                                    Move to {data.columns[colId].title}
                                  </button>
                                )
                              ))}
                            </div>
                          </div>
                          <Link to={`/tasks/edit/${task._id}`} className="text-blue-500 hover:text-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getTaskTypeBadge(task.taskType)}
                        {task.priority && getPriorityBadge(task.priority)}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          {task.assignedTo ? (
                            <div className="flex items-center">
                              {task.assignedTo.avatarUrl ? (
                                <img
                                  className="h-6 w-6 rounded-full mr-1"
                                  src={task.assignedTo.avatarUrl.startsWith('http') 
                                    ? task.assignedTo.avatarUrl 
                                    : `http://localhost:5000${task.assignedTo.avatarUrl}`}
                                  alt={task.assignedTo.username}
                                  onError={(e) => {
                                    e.currentTarget.src = "/images/user/owner.jpg";
                                  }}
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-gray-300 mr-1 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {task.assignedTo.firstName?.charAt(0) || task.assignedTo.username?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                              <span>
                                {task.assignedTo.firstName && task.assignedTo.lastName
                                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                  : task.assignedTo.username || 'Unknown'}
                              </span>
                            </div>
                          ) : (
                            <span>Unassigned</span>
                          )}
                        </div>
                        
                        <div>
                          {task.dueDate && (
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="empty-column">
                      No tasks in this column
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
