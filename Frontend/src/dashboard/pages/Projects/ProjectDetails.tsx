import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";

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
  deadline: string;
  status: string;
  members: Array<{
    user: User;
    role: string;
    addedAt: string;
  }>;
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

        // Récupérer les tâches associées au projet
        const tasksResponse = await axios.get(`http://localhost:5000/tasks/project/${projectId}`);
        setTasks(tasksResponse.data);
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
    if (!dateString) return 'Non définie';
    
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    let color: "primary" | "success" | "warning" | "error" | "light" = "light";
    let label = status;

    switch (status?.toLowerCase()) {
      case "pending":
      case "en attente":
        color = "warning";
        label = "En attente";
        break;
      case "in progress":
      case "en cours":
        color = "primary";
        label = "En cours";
        break;
      case "completed":
      case "terminé":
        color = "success";
        label = "Terminé";
        break;
      case "cancelled":
      case "annulé":
        color = "error";
        label = "Annulé";
        break;
      default:
        color = "light";
    }

    return (
      <Badge size="sm" color={color}>
        {label}
      </Badge>
    );
  };

  return (
    <div>
      <PageMeta
        title={project?.name || "Project Details"}
        description="View project details and associated tasks"
      />
      <PageBreadcrumb pageTitle={project?.name || "Project Details"} />

      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/form-elements")}
        >
          Retour à la liste des projets
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/kanban`)}
          >
            Vue Kanban
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/tasks/create?projectId=${projectId}`)}
          >
            Ajouter une tâche
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
            <ComponentCard title="Détails du projet">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informations générales</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {project.name}</p>
                    <p><span className="font-medium">Catégorie:</span> {project.category}</p>
                    <p><span className="font-medium">Statut:</span> {getStatusBadge(project.status)}</p>
                    <p><span className="font-medium">Date de début:</span> {formatDate(project.startDate)}</p>
                    <p><span className="font-medium">Date limite:</span> {formatDate(project.deadline)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Membres du projet</h3>
                {project.members && project.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.members.map((member) => (
                      <div key={member.user._id} className="flex items-center p-3 border rounded-lg">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                          <img
                            className="h-full w-full object-cover"
                            src={member.user.avatarUrl ?
                              (member.user.avatarUrl.startsWith('http') ? member.user.avatarUrl :
                               member.user.avatarUrl.startsWith('/') ? `http://localhost:5000${member.user.avatarUrl}` :
                               `http://localhost:5000/${member.user.avatarUrl}`) :
                              "/images/user/owner.jpg"}
                            alt={member.user.username}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/user/owner.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.firstName && member.user.lastName
                              ? `${member.user.firstName} ${member.user.lastName}`
                              : member.user.username}
                          </p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucun membre assigné à ce projet</p>
                )}
              </div>
            </ComponentCard>
          )}

          <ComponentCard title="Tâches associées" className="mt-6">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune tâche associée à ce projet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/tasks/create?projectId=${projectId}`)}
                >
                  Créer une tâche
                </Button>
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
                        Date limite
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Actions
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
                          <div className="text-sm text-gray-900 dark:text-white">{task.taskType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {task.assignedTo ? (
                              <>
                                <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                                  <img
                                    className="h-full w-full object-cover"
                                    src={task.assignedTo.avatarUrl ?
                                      (task.assignedTo.avatarUrl.startsWith('http') ? task.assignedTo.avatarUrl :
                                       task.assignedTo.avatarUrl.startsWith('/') ? `http://localhost:5000${task.assignedTo.avatarUrl}` :
                                       `http://localhost:5000/${task.assignedTo.avatarUrl}`) :
                                      "/images/user/owner.jpg"}
                                    alt={task.assignedTo.username}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/images/user/owner.jpg";
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
                              <div className="text-sm text-gray-500 dark:text-gray-400">Non assigné</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(task.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            onClick={() => navigate(`/tasks/edit/${task._id}`)}
                          >
                            Modifier
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ComponentCard>
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
