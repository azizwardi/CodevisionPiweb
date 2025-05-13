import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Button from "../../dashboard/components/ui/button/Button";
import Badge from "../../dashboard/components/ui/badge/Badge";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  email?: string;
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
}

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError("");

        // Récupérer les détails du projet
        const projectResponse = await axios.get(`http://localhost:5000/projects/${projectId}`);
        setProject(projectResponse.data);

        // Récupérer toutes les tâches associées au projet
        console.log(`Récupération des tâches pour le projet ${projectId}...`);
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
          const tasksResponse = await axios.get(
            `http://localhost:5000/tasks/project/${projectId}`,
            { headers }
          );
          console.log(`Tâches récupérées: ${tasksResponse.data.length}`);

          // Afficher les détails des tâches pour le débogage
          if (tasksResponse.data.length > 0) {
            console.log("Exemple de tâche récupérée:", tasksResponse.data[0]);
          } else {
            console.log("Aucune tâche trouvée pour ce projet");
          }

          setTasks(tasksResponse.data);
        } catch (error) {
          console.error("Erreur lors de la récupération des tâches:", error);
          throw error;
        }
      } catch (err: any) {
        console.error("Error fetching project details:", err);
        setError(err.response?.data?.message || err.message || "Failed to fetch project details");
        toastManager.addToast("Error loading project details", "error", 5000);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    let color = "";
    let label = "";

    switch (status) {
      case "pending":
        color = "warning";
        label = "En attente";
        break;
      case "in-progress":
        color = "info";
        label = "En cours";
        break;
      case "completed":
        color = "success";
        label = "Terminé";
        break;
      default:
        color = "default";
        label = status;
    }

    return (
      <Badge size="sm" color={color}>
        {label}
      </Badge>
    );
  };

  // Fonction pour obtenir le badge de type de tâche
  const getTaskTypeBadge = (taskType: string) => {
    let color = "";
    let label = taskType;

    switch (taskType) {
      case "development":
        color = "primary";
        label = "Développement";
        break;
      case "design":
        color = "info";
        label = "Design";
        break;
      case "testing":
        color = "warning";
        label = "Test";
        break;
      case "documentation":
        color = "default";
        label = "Documentation";
        break;
      case "bug-fix":
        color = "error";
        label = "Correction de bug";
        break;
      case "feature":
        color = "success";
        label = "Fonctionnalité";
        break;
      case "maintenance":
        color = "default";
        label = "Maintenance";
        break;
      case "JAVA":
        color = "primary";
        label = "Java";
        break;
      case "DEVOPS":
        color = "info";
        label = "DevOps";
        break;
      case "JS":
        color = "warning";
        label = "JavaScript";
        break;
      default:
        color = "default";
        label = taskType || "Autre";
    }

    return (
      <Badge size="sm" color={color}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{project?.name || "Détails du projet"}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/member/projects/${projectId}/kanban`)}
          >
            Vue Kanban
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/member/projects")}
          >
            Retour à la liste des projets
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-error-50 text-error-700 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          {project && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Détails du projet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informations générales</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {project.name}</p>
                    <p><span className="font-medium">Catégorie:</span> {project.category}</p>
                    <p><span className="font-medium">Statut:</span> {getStatusBadge(project.status)}</p>
                    <p><span className="font-medium">Date de début:</span> {formatDate(project.startDate)}</p>
                    <p><span className="font-medium">Date de fin:</span> {formatDate(project.endDate)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Chef d'équipe</h3>
                {project.teamLeader ? (
                  <div className="flex items-center p-3 border rounded-lg max-w-md">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img
                        className="h-full w-full object-cover"
                        src={project.teamLeader.avatarUrl ?
                          (project.teamLeader.avatarUrl.startsWith('http') ? project.teamLeader.avatarUrl :
                           project.teamLeader.avatarUrl.startsWith('/') ? `http://localhost:5000${project.teamLeader.avatarUrl}` :
                           `http://localhost:5000/${project.teamLeader.avatarUrl}`) :
                          "/images/user/owner.jpg"}
                        alt={project.teamLeader.username}
                        onError={(e) => {
                          e.currentTarget.src = "/images/user/owner.jpg";
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {project.teamLeader.firstName && project.teamLeader.lastName
                          ? `${project.teamLeader.firstName} ${project.teamLeader.lastName}`
                          : project.teamLeader.username}
                      </p>
                      <p className="text-sm text-gray-500">Chef d'équipe</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun chef d'équipe assigné</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Membres de l'équipe</h3>
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.teamMembers.map((member) => (
                      <div key={member._id} className="flex items-center p-3 border rounded-lg">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                          <img
                            className="h-full w-full object-cover"
                            src={member.avatarUrl ?
                              (member.avatarUrl.startsWith('http') ? member.avatarUrl :
                               member.avatarUrl.startsWith('/') ? `http://localhost:5000${member.avatarUrl}` :
                               `http://localhost:5000/${member.avatarUrl}`) :
                              "/images/user/owner.jpg"}
                            alt={member.username}
                            onError={(e) => {
                              e.currentTarget.src = "/images/user/owner.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.firstName && member.lastName
                              ? `${member.firstName} ${member.lastName}`
                              : member.username}
                          </p>
                          <p className="text-sm text-gray-500">Membre</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun membre assigné à ce projet</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tâches associées</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune tâche associée à ce projet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Assigné à
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Date d'échéance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTaskTypeBadge(task.taskType)}
                        </td>
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
                                      e.currentTarget.src = "/images/user/owner.jpg";
                                    }}
                                  />
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {task.assignedTo.firstName && task.assignedTo.lastName
                                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                    : task.assignedTo.username}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">Non assigné</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(task.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
