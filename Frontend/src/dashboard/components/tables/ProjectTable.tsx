import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import CommentSection from "../comments/CommentSection";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { toastManager } from "../ui/toast/ToastContainer";
import AssignMembersModal from "../modals/AssignMembersModal";

// Interface pour les données de projet
interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  deadline: string;
  projectId: string;
  createdAt: string;
  members?: Array<{
    user: {
      _id: string;
      username: string;
      email: string;
    };
    role: string;
    addedAt: string;
  }>;
}

interface ProjectTableProps {
  onEdit: (projectId: string) => void;
  refreshTrigger: number;
  isAdmin?: boolean;
}

export default function ProjectTable({ onEdit, refreshTrigger, isAdmin = false }: ProjectTableProps) {
  const navigate = useNavigate();
  // État pour stocker les données des projets
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Effet pour récupérer l'ID de l'utilisateur depuis le token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<{ id: string; user?: { id: string } }>(token);
        const id = decoded.user?.id || decoded.id;
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
      }
    }
  }, []);

  // Fonction pour récupérer les projets
  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:5000/projects");

      // Si c'est un admin, afficher tous les projets
      if (isAdmin) {
        setProjects(response.data);
      } else {
        // Pour les TeamLeaders, filtrer les projets dont ils sont créateurs
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'TeamLeader' && userId) {
          const filteredProjects = response.data.filter(
            (project: any) => project.creator === userId
          );
          setProjects(filteredProjects);
        } else {
          // Pour les autres rôles, afficher tous les projets
          setProjects(response.data);
        }
      }
    } catch (err: any) {
      console.error("Erreur lors de la récupération des projets:", err);
      setError("Échec du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  // Effet pour récupérer les données des projets depuis l'API
  useEffect(() => {
    if (userId || isAdmin) {
      fetchProjects();
    }
  }, [refreshTrigger, userId, isAdmin]);

  const handleDelete = async (projectId: string) => {
    // Récupérer l'ID de l'utilisateur connecté
    const token = localStorage.getItem("authToken");
    if (!token) {
      toastManager.addToast("Vous devez être connecté pour supprimer un projet", "error", 5000);
      return;
    }

    // Décoder le token pour obtenir l'ID utilisateur
    interface DecodedToken {
      user?: {
        id: string;
      };
      id?: string;
    }

    let userId;
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      userId = decodedToken.user?.id || decodedToken.id;

      if (!userId) {
        toastManager.addToast("Impossible d'identifier l'utilisateur", "error", 5000);
        return;
      }
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      toastManager.addToast("Erreur d'authentification", "error", 5000);
      return;
    }

    // Confirmation plus détaillée pour la suppression
    if (!window.confirm(
      "Attention : Cette action est irréversible.\n\n" +
      "Êtes-vous sûr de vouloir supprimer définitivement ce projet ?\n" +
      "Toutes les données associées seront perdues."
    )) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/projects/${projectId}`, {
        data: { userId }
      });

      // Mettre à jour la liste des projets après la suppression
      setProjects(projects.filter(project => project._id !== projectId));

      // Afficher un toast de confirmation
      const projectName = projects.find(p => p._id === projectId)?.name || "Le projet";
      const message = `${projectName} a été supprimé avec succès`;
      toastManager.addToast(message, "success", 5000);
    } catch (err: any) {
      console.error("Erreur lors de la suppression du projet:", err);

      // Vérifier si l'erreur est due à un problème d'autorisation
      if (err.response?.status === 403) {
        // Afficher une popup d'erreur d'autorisation
        window.alert("Vous n'êtes pas autorisé à supprimer ce projet car vous n'en êtes pas le créateur.");
      } else {
        const errorMessage = `Erreur lors de la suppression: ${err.response?.data?.message || "Une erreur est survenue"}`;
        toastManager.addToast(errorMessage, "error", 5000);
      }
    }
  };

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

  // Fonction pour déterminer le statut du projet en fonction de la date limite
  const getProjectStatus = (deadline: string | undefined) => {
    if (!deadline) {
      return { label: "Non planifié", color: "primary" as const };
    }

    const today = new Date();
    const deadlineDate = new Date(deadline);

    // Vérifier si la date est valide
    if (isNaN(deadlineDate.getTime())) {
      return { label: "Date invalide", color: "primary" as const };
    }

    // Calculer la différence en jours
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "En retard", color: "error" as const };
    } else if (diffDays <= 7) {
      return { label: "Urgent", color: "warning" as const };
    } else {
      return { label: "En cours", color: "success" as const };
    }
  };

  // Fonction pour obtenir le libellé de la catégorie
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      "web": "Développement Web",
      "mobile": "Développement Mobile",
      "design": "Design",
      "marketing": "Marketing",
      "other": "Autre"
    };

    return categories[category] || category;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">Chargement des projets...</p>
        </div>
      ) : error ? (
        <div className="p-5 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Nom du projet
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Catégorie
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date de début
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date limite
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {projects.map((project) => {
                  const status = getProjectStatus(project.deadline);
                  return (
                    <React.Fragment key={project._id}>
                      <TableRow>
                      <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                        {project.name || 'Sans nom'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {project.category ? getCategoryLabel(project.category) : 'Non catégorisé'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {project.startDate ? formatDate(project.startDate) : 'Non définie'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {project.deadline ? formatDate(project.deadline) : 'Non définie'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge size="sm" color={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex gap-2">
                          {!isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setExpandedProjectId(expandedProjectId === project._id ? null : project._id)}
                              >
                                {expandedProjectId === project._id ? "Masquer" : "Commentaires"}
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  // Rediriger en fonction du rôle de l'utilisateur
                                  const userRole = localStorage.getItem("userRole");
                                  if (userRole?.toLowerCase() === "teamleader") {
                                    navigate(`/team-leader/projects/${project._id}`);
                                  } else if (userRole?.toLowerCase() === "member") {
                                    navigate(`/member/projects/${project._id}`);
                                  } else {
                                    // Pour les administrateurs et autres rôles
                                    navigate(`/projects/${project._id}`);
                                  }
                                }}
                              >
                                Voir les tâches
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEdit(project._id)}
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowAssignModal(true);
                                }}
                              >
                                Assigner membres
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-error-500 hover:bg-error-50 hover:text-error-700"
                                onClick={() => handleDelete(project._id)}
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  navigate(`/projects/${project._id}`);
                                }}
                              >
                                Voir les tâches
                              </Button>
                              <span className="text-gray-400 text-sm ml-2 self-center">Accès en lecture seule</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Section de commentaires expansible - uniquement pour les non-admins */}
                    {!isAdmin && expandedProjectId === project._id && (
                      <TableRow>
                        <TableCell className="px-4 py-4 bg-gray-50 dark:bg-gray-800" colSpan={5}>
                          <CommentSection projectId={project._id} />
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal d'assignation des membres */}
      {showAssignModal && selectedProject && (
        <AssignMembersModal
          projectId={selectedProject._id}
          projectName={selectedProject.name}
          onClose={() => setShowAssignModal(false)}
          onMemberAdded={() => {
            // Rafraîchir la liste des projets après l'ajout d'un membre
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
