import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import TextArea from "../../dashboard/components/form/input/TextArea";
import Select from "../../dashboard/components/form/Select";
import Button from "../../dashboard/components/ui/button/Button";

// Interface pour les membres du projet
interface ProjectMember {
  user: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  role: string;
  addedAt: string;
}

interface Project {
  _id: string;
  name: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  projectId?: string;
  dueDate?: string;
  status?: string;
  taskType?: string;
  formError?: string;
}

interface DecodedToken {
  id?: string;
  user?: {
    id: string;
  };
}

// 👇 Ajout des props pour CreateTask
interface CreateTaskProps {
  onClose: () => void;
  onTaskCreated: (newTask: any) => void;
}

// 👇 Accepter les props dans CreateTask
const CreateTask: React.FC<CreateTaskProps> = ({ onClose, onTaskCreated }) => {

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    taskType: "development",
    assignedTo: "",
    projectId: "",
    dueDate: "",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID de l'utilisateur depuis le token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const id = decoded.user?.id || decoded.id;
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
      }
    }
  }, []);

  // Récupérer les projets créés par l'utilisateur connecté
  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;

      try {
        const projectsResponse = await axios.get("http://localhost:5000/projects");
        if (projectsResponse.data && projectsResponse.data.length > 0) {
          // Filtrer les projets pour n'inclure que ceux créés par l'utilisateur connecté
          const userProjects = projectsResponse.data.filter(
            (project: any) => project.creator === userId
          );
          setProjects(userProjects);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        toastManager.addToast("Erreur lors du chargement des projets", "error", 5000);
      }
    };

    fetchProjects();
  }, [userId]);

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Validation en temps réel
    const errors = { ...validationErrors };

    if (field === "title") {
      // Effacer l'erreur existante
      delete errors.title;

      // Validation du titre en temps réel
      if (value.length > 0 && value.length < 3) {
        errors.title = "Title must be at least 3 characters";
      } else if (value.length > 100) {
        errors.title = "Title cannot exceed 100 characters";
      } else if (value.length > 0 && !/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()[\]{}#@!?]+$/.test(value)) {
        errors.title = "Title contains invalid characters";
      }
    } else if (field === "description") {
      // Effacer l'erreur existante
      delete errors.description;

      // Validation de la description en temps réel
      if (value.length > 0 && value.length < 10) {
        errors.description = "Description must be at least 10 characters";
      } else if (value.length > 1000) {
        errors.description = "Description cannot exceed 1000 characters";
      }
    } else if (field === "dueDate") {
      // Effacer l'erreur existante
      delete errors.dueDate;

      // Validation de la date d'échéance en temps réel
      if (value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit
        const dueDate = new Date(value);

        if (dueDate < today) {
          errors.dueDate = "Due date cannot be in the past";
        }
      }
    } else if (validationErrors[field as keyof ValidationErrors]) {
      // Pour les autres champs, effacer simplement l'erreur
      delete errors[field as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    // Validation du titre
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      errors.title = "Title cannot exceed 100 characters";
    } else if (!/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()[\]{}#@!?]+$/.test(formData.title)) {
      // Permet les lettres, chiffres, espaces, accents, tirets, underscores, points, virgules, parenthèses, crochets, accolades, dièse, arobase, point d'exclamation et point d'interrogation
      errors.title = "Title contains invalid characters";
    }

    // Validation de la description
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters";
    }

    // Validation du projet
    if (!formData.projectId) {
      errors.projectId = "Please select a project";
    } else if (!/^[0-9a-fA-F]{24}$/.test(formData.projectId)) {
      errors.projectId = "Invalid project ID format";
    }

    // Validation de la date d'échéance
    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit
      const dueDate = new Date(formData.dueDate);

      if (dueDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    // Validation du statut
    if (!formData.status) {
      errors.status = "Status is required";
    }

    // Validation du type de tâche
    if (!formData.taskType) {
      errors.taskType = "Task type is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Récupérer les membres du projet sélectionné
      const projectMembersResponse = await axios.get(`http://localhost:5000/projects/${formData.projectId}/members`);
      const projectMembers = projectMembersResponse.data as ProjectMember[];

      // Vérifier s'il y a des membres dans le projet
      if (!projectMembers || projectMembers.length === 0) {
        setSubmitError("Ce projet n'a pas de membres. Veuillez d'abord ajouter des membres au projet.");
        toastManager.addToast("Ce projet n'a pas de membres", "error", 5000);
        setLoading(false);
        return;
      }

      // Sélectionner le premier membre du projet
      const assignedMember = projectMembers[0].user._id;

      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        taskType: formData.taskType,
        assignedTo: formData.assignedTo || assignedMember, // Utiliser la valeur sélectionnée ou assigner automatiquement
        projectId: formData.projectId,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        userId: userId, // Ajouter l'ID du créateur (team leader)
      };

      const isValidMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

      if (!isValidMongoId(assignedMember)) {
        throw new Error("Invalid user ID format");
      }
      if (!isValidMongoId(formData.projectId)) {
        throw new Error("Invalid project ID format");
      }

      const response = await axios.post("http://localhost:5000/tasks", taskData);

      toastManager.addToast("Task created successfully", "success", 5000);

      // 👇 Appeler onTaskCreated et onClose après création
      onTaskCreated(response.data);
      onClose();

    } catch (err: any) {
      console.error("Error creating task:", err);
      setSubmitError(err.response?.data?.message || "Failed to create task");
      toastManager.addToast("Error creating task", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const taskTypeOptions = [
    { value: "development", label: "Development" },
    { value: "design", label: "Design" },
    { value: "testing", label: "Testing" },
    { value: "documentation", label: "Documentation" },
    { value: "bug-fix", label: "Bug Fix" },
    { value: "feature", label: "Feature" },
    { value: "maintenance", label: "Maintenance" },
    { value: "JAVA", label: "Java" },
    { value: "DEVOPS", label: "DevOps" },
    { value: "JS", label: "JavaScript" },
    { value: "other", label: "Other" },
  ];
  const projectOptions = projects.map(project => ({
    value: project._id,
    label: project.name,
  }));

  return (
    <div>
      <PageMeta title="Create Task | CodevisionPiweb" description="Create a new task for CodevisionPiweb" />
      <PageBreadcrumb pageTitle="Create Task" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {submitError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {validationErrors.formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{validationErrors.formError}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Create a New Task</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Fill in all required fields (marked with *) to create a new task. The task will be automatically assigned to a project member.
            </p>
          </div>

          <div>
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              error={!!validationErrors.title}
              hint={validationErrors.title}
              placeholder="Enter a clear and concise task title"
              required
            />
            {!validationErrors.title && (
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={(value) => handleChange("description", value)}
              rows={4}
              error={!!validationErrors.description}
              hint={validationErrors.description}
              placeholder="Describe the task in detail, including requirements and expected outcomes"
              required
            />
            {!validationErrors.description && (
              <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 characters</p>
            )}
          </div>

          <div>
            <Label htmlFor="projectId">Project <span className="text-red-500">*</span></Label>
            <Select
              id="projectId"
              name="projectId"
              options={projectOptions}
              placeholder="Select a project"
              onChange={(value) => handleChange("projectId", value)}
              value={formData.projectId}
              error={!!validationErrors.projectId}
              required
            />
            {validationErrors.projectId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.projectId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Note: The task will be automatically assigned to a project member.
            </p>
            {projects.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Warning:</span> You don't have any projects yet. Please create a project first.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
              <Select
                id="status"
                name="status"
                options={statusOptions}
                placeholder="Select status"
                onChange={(value) => handleChange("status", value)}
                value={formData.status}
                error={!!validationErrors.status}
                required
              />
              {validationErrors.status && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.status}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The initial status of the task.
              </p>
            </div>

            <div>
              <Label htmlFor="taskType">Task Type <span className="text-red-500">*</span></Label>
              <Select
                id="taskType"
                name="taskType"
                options={taskTypeOptions}
                placeholder="Select task type"
                onChange={(value) => handleChange("taskType", value)}
                value={formData.taskType}
                error={!!validationErrors.taskType}
                required
              />
              {validationErrors.taskType && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.taskType}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                The type of work required for this task.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                error={!!validationErrors.dueDate}
                hint={validationErrors.dueDate}
                min={new Date().toISOString().split('T')[0]} // Empêche de sélectionner des dates passées
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                The deadline for completing this task. Must be a future date.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || projects.length === 0}
              className="inline-flex items-center justify-center gap-2"
            >
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>

          {projects.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-sm text-yellow-700 font-medium">
                You need to create a project before you can create tasks.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Go to the Projects section to create a new project first.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
