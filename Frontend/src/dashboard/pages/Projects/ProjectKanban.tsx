import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import "../../pages/Tasks/KanbanBoard.css";

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
  status: string;
  startDate: string;
  endDate: string;
  teamLeaderId?: User;
  members: User[];
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

const ProjectKanban: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
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

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch project and tasks
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        // Fetch project details
        console.log(`Fetching project details for project ${projectId}...`);
        const projectResponse = await axios.get(`http://localhost:5000/projects/${projectId}`, { headers });
        console.log("Project details fetched successfully:", projectResponse.data);
        setProject(projectResponse.data);

        // Fetch tasks for this project
        console.log(`Fetching tasks for project ${projectId}...`);
        let tasks = [];
        try {
          // Récupérer toutes les tâches du projet
          try {
            const tasksResponse = await axios.get(`http://localhost:5000/tasks/project/${projectId}`, { headers });
            console.log("All project tasks fetched successfully:", tasksResponse.data);
            tasks = tasksResponse.data;

            // Si aucune tâche n'est trouvée, afficher un message
            if (tasks.length === 0) {
              console.log("Aucune tâche dans ce projet.");
            }
          } catch (error) {
            console.error("Error fetching project tasks:", error);
            throw error;
          }
        } catch (taskError) {
          console.error("Error fetching tasks:", taskError);
          throw new Error(`Failed to fetch tasks: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`);
        }

        // Process tasks for Kanban board
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
        toastManager.addToast("Error loading project data", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Fonction pour changer le statut d'une tâche
  const changeTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = data.tasks[taskId];
      const updatedTask = { ...task, status: newStatus };

      // Mettre à jour la tâche dans la base de données
      await axios.put(`http://localhost:5000/tasks/${taskId}`, updatedTask);
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

  const getStatusBadge = (status: string) => {
    let color: "primary" | "info" | "warning" | "light" | "error" | "success" = "light";

    switch (status) {
      case "active":
        color = "success";
        break;
      case "pending":
        color = "warning";
        break;
      case "completed":
        color = "primary";
        break;
      case "cancelled":
        color = "error";
        break;
      default:
        color = "light";
    }

    return <Badge color={color}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-4">Loading project data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading project data: {error}</div>;
  }

  if (!project) {
    return <div className="p-4 text-red-600">Project not found</div>;
  }

  return (
    <div>
      <PageMeta
        title={`${project.name} | Kanban Board`}
        description={`Kanban Board for ${project.name}`}
      />
      <PageBreadcrumb pageTitle={`Project: ${project.name}`} />

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex flex-wrap justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{project.description}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="mb-2">{getStatusBadge(project.status)}</div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">Category:</span> {project.category}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Timeline</h3>
            <div className="flex space-x-4">
              <div>
                <span className="block text-xs text-gray-500">Start Date</span>
                <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">End Date</span>
                <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Team</h3>
            <div className="flex -space-x-2 overflow-hidden">
              {project.members.map(member => (
                <div key={member._id} className="relative" title={member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.username}>
                  {member.avatarUrl ? (
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                      src={member.avatarUrl.startsWith('http')
                        ? member.avatarUrl
                        : `http://localhost:5000${member.avatarUrl}`}
                      alt={member.username}
                      onError={(e) => {
                        e.currentTarget.src = "/images/user/owner.jpg";
                      }}
                    />
                  ) : (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {member.firstName?.charAt(0) || member.username?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm">
            <span className="font-medium">Tasks:</span> {Object.keys(data.tasks).length} total
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                // Déterminer la redirection en fonction du rôle de l'utilisateur
                const userRole = localStorage.getItem("userRole");
                if (userRole?.toLowerCase() === "teamleader") {
                  navigate("/team-leader/projects");
                } else if (userRole?.toLowerCase() === "member") {
                  navigate("/member/projects");
                } else {
                  navigate("/projects");
                }
              }}
            >
              Back to Projects
            </Button>
            {localStorage.getItem("userRole")?.toLowerCase() !== "member" && (
              <Link to={`/tasks/create?projectId=${projectId}`}>
                <Button variant="primary">Add Task</Button>
              </Link>
            )}
          </div>
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
                          {localStorage.getItem("userRole")?.toLowerCase() !== "member" && (
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
                          )}
                          <Link
                            to={localStorage.getItem("userRole")?.toLowerCase() === "member"
                              ? `/member/tasks/edit/${task._id}`
                              : `/tasks/edit/${task._id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
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

export default ProjectKanban;
