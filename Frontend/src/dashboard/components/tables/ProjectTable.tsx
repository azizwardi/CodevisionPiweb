import { useState, useEffect } from "react";
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
}

interface ProjectTableProps {
  onEdit: (projectId: string) => void;
  refreshTrigger: number;
}

export default function ProjectTable({ onEdit, refreshTrigger }: ProjectTableProps) {
  // État pour stocker les données des projets
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Effet pour récupérer les données des projets depuis l'API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError("");
      try {
        // Pour le débogage, nous n'utilisons pas le token d'authentification
        // const token = localStorage.getItem("authToken");
        // if (!token) {
        //   throw new Error("Aucun token d'authentification trouvé");
        // }

        const response = await axios.get("http://localhost:8000/projects", {
          // headers: {
          //   Authorization: `Bearer ${token}`
          // }
        });

        setProjects(response.data);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des projets:", err);
        setError("Échec du chargement des projets");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [refreshTrigger]);

  const handleDelete = async (projectId: string) => {
    // Confirmation plus détaillée pour la suppression
    if (!window.confirm(
      "Attention : Cette action est irréversible.\n\n" +
      "Êtes-vous sûr de vouloir supprimer définitivement ce projet ?\n" +
      "Toutes les données associées seront perdues."
    )) {
      return;
    }

    // Pour le débogage, nous n'utilisons pas le token d'authentification
    // const token = localStorage.getItem("authToken");
    // if (!token) {
    //   throw new Error("Aucun token d'authentification trouvé");
    // }

    try {
      await axios.delete(`http://localhost:8000/projects/${projectId}`, {
        // headers: {
        //   Authorization: `Bearer ${token}`
        // }
      });

      // Mettre à jour la liste des projets après la suppression
      setProjects(projects.filter(project => project._id !== projectId));

      // Afficher un toast de confirmation
      const projectName = projects.find(p => p._id === projectId)?.name || "Le projet";
      const message = `${projectName} a été supprimé avec succès`;
      toastManager.addToast(message, "success", 5000);
    } catch (err: any) {
      console.error("Erreur lors de la suppression du projet:", err);
      const errorMessage = `Erreur lors de la suppression: ${err.response?.data?.message || "Une erreur est survenue"}`;
      toastManager.addToast(errorMessage, "error", 5000);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Fonction pour déterminer le statut du projet en fonction de la date limite
  const getProjectStatus = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);

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
                    Description
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
                    <TableRow key={project._id}>
                      <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                        {project.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {project.description.length > 50
                          ? `${project.description.substring(0, 50)}...`
                          : project.description}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {getCategoryLabel(project.category)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(project.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(project.deadline)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge size="sm" color={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(project._id)}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-error-500 hover:bg-error-50 hover:text-error-700"
                            onClick={() => handleDelete(project._id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
