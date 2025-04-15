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

// Interface for project data
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
  onAddProject?: () => void; // Function to navigate to project addition
}

export default function ProjectTable({ onEdit, refreshTrigger, onAddProject }: ProjectTableProps) {
  // State to store project data
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Effect to fetch project data from the API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError("");
      try {
        // For debugging, we're not using the authentication token
        // const token = localStorage.getItem("authToken");
        // if (!token) {
        //   throw new Error("No authentication token found");
        // }

        const response = await axios.get("http://localhost:8000/projects", {
          // headers: {
          //   Authorization: `Bearer ${token}`
          // }
        });

        const projectsData = response.data;
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (err: any) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
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
      return { label: "Late", color: "error" as const };
    } else if (diffDays <= 7) {
      return { label: "Urgent", color: "warning" as const };
    } else {
      return { label: "In Progress", color: "success" as const };
    }
  };

  // Fonction pour obtenir le libellé de la catégorie
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      "web": "Web Development",
      "mobile": "Mobile Development",
      "design": "Design",
      "marketing": "Marketing",
      "other": "Other"
    };

    return categories[category] || category;
  };

  // Fonction pour générer des suggestions de recherche
  useEffect(() => {
    if (projects.length > 0) {
      // Extraire des termes uniques des projets pour les suggestions
      const projectNames = [...new Set(projects.map(p => p.name))];
      const categories = [...new Set(projects.map(p => getCategoryLabel(p.category)))];

      // Limiter à 5 suggestions de chaque type
      const nameSuggestions = projectNames.slice(0, 5);
      const categorySuggestions = categories.slice(0, 5);

      setSuggestions([...nameSuggestions, ...categorySuggestions]);
    }
  }, [projects]);

  // Function to filter projects based on search term
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowSuggestions(term.trim() !== "");

    // Check if it's a special command
    if (term.startsWith("/")) {
      handleCommand(term);
      return;
    }

    if (term.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const termLower = term.toLowerCase();
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(termLower) ||
        project.description.toLowerCase().includes(termLower) ||
        getCategoryLabel(project.category).toLowerCase().includes(termLower)
      );
      setFilteredProjects(filtered);
    }
  };

  // Function to handle special commands
  const handleCommand = (command: string) => {
    const commandLower = command.toLowerCase();

    if (commandLower === "/add" || commandLower === "/new") {
      // Navigate to project addition page
      if (onAddProject) {
        onAddProject();
      }
    } else if (commandLower === "/urgent") {
      // Filter urgent projects
      const urgentProjects = projects.filter(project => {
        const status = getProjectStatus(project.deadline);
        return status.label.toLowerCase() === "urgent";
      });
      setFilteredProjects(urgentProjects);
    } else if (commandLower === "/all") {
      // Show all projects
      setFilteredProjects(projects);
    }
  };

  // Fonction pour sélectionner une suggestion
  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);

    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(suggestion.toLowerCase()) ||
      getCategoryLabel(project.category).toLowerCase().includes(suggestion.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Barre de recherche */}
      <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a project..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-white/[0.05] dark:border-white/[0.1] dark:text-white"
            onFocus={() => setShowSuggestions(searchTerm.trim() !== "")}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Suggestions de recherche */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <ul>
                {suggestions
                  .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 5)
                  .map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))
                }
              </ul>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-5 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">No projects found</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">No projects match your search "{searchTerm}"</p>
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
                    Project Name
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
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Start Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Deadline
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
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
                {filteredProjects.map((project) => {
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
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-error-500 hover:bg-error-50 hover:text-error-700"
                            onClick={() => handleDelete(project._id)}
                          >
                            Delete
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
