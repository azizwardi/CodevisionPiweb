import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Project {
  _id: string;
  name: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  assignedTo?: string;
  projectId?: string;
  dueDate?: string;
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    taskType: "development",
    assignedTo: "",
    projectId: "",
    dueDate: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");

  // Chargement des utilisateurs et des projets
  useEffect(() => {
    // Définir des utilisateurs statiques pour permettre l'utilisation de l'application
    // Utiliser des IDs au format MongoDB (24 caractères hexadécimaux)
    const staticUsers: User[] = [
      { _id: "507f1f77bcf86cd799439011", username: "admin", firstName: "Admin", lastName: "User" },
      { _id: "507f1f77bcf86cd799439012", username: "member1", firstName: "Team", lastName: "Member" },
      { _id: "507f1f77bcf86cd799439013", username: "leader1", firstName: "Team", lastName: "Leader" },
    ];

    // Projets statiques en cas d'échec
    // Utiliser des IDs au format MongoDB (24 caractères hexadécimaux)
    const staticProjects: Project[] = [
      { _id: "507f1f77bcf86cd799439021", name: "Projet Web" },
      { _id: "507f1f77bcf86cd799439022", name: "Projet Mobile" },
      { _id: "507f1f77bcf86cd799439023", name: "Projet Design" },
    ];

    // Utiliser d'abord les données statiques pour assurer que l'interface fonctionne
    console.log("Using static data initially");
    setUsers(staticUsers);
    setProjects(staticProjects);

    // Fetch projects
    const fetchProjects = async () => {
      try {
        const projectsResponse = await axios.get("http://localhost:8000/projects");
        console.log("Projects fetched successfully:", projectsResponse.data);
        if (projectsResponse.data && projectsResponse.data.length > 0) {
          setProjects(projectsResponse.data);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        toastManager.addToast("Erreur lors du chargement des projets", "error", 5000);
      }
    };

    // Récupération des utilisateurs - essayer directement le port 5000
    const fetchUsers = async () => {
      try {
        // Récupérer le token d'authentification
        const token = localStorage.getItem("authToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log("Fetching users from port 5000...");
        const usersResponse = await axios.get("http://localhost:5000/api/user/showuser", { headers });
        console.log("Users fetched successfully from port 5000:", usersResponse.data);

        if (usersResponse.data && usersResponse.data.length > 0) {
          setUsers(usersResponse.data);
        }
      } catch (userErr) {
        console.error("Error fetching users from port 5000:", userErr);
        toastManager.addToast("Erreur lors du chargement des utilisateurs", "error", 5000);
      }
    };

    // Exécuter les requêtes
    fetchProjects();
    fetchUsers();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [field]: undefined,
      });
    }
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.assignedTo) {
      errors.assignedTo = "Please assign this task to a user";
    }

    if (!formData.projectId) {
      errors.projectId = "Please select a project";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    console.log("Form data before validation:", formData);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setLoading(true);
    console.log("Submitting form data:", formData);

    try {
      // Envoyer les données à l'API
      console.log("Sending task data to API:", formData);
      console.log("assignedTo type:", typeof formData.assignedTo);
      console.log("projectId type:", typeof formData.projectId);

      // Convertir les données pour MongoDB
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        taskType: formData.taskType,
        // S'assurer que les IDs sont au bon format pour MongoDB
        assignedTo: formData.assignedTo,
        projectId: formData.projectId,
        // Convertir la date au format ISO
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
      };

      // Vérifier si les IDs sont valides pour MongoDB (24 caractères hexadécimaux)
      const isValidMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

      if (!isValidMongoId(formData.assignedTo)) {
        console.error("Invalid MongoDB ID format for assignedTo:", formData.assignedTo);
        throw new Error("Invalid user ID format");
      }

      if (!isValidMongoId(formData.projectId)) {
        console.error("Invalid MongoDB ID format for projectId:", formData.projectId);
        throw new Error("Invalid project ID format");
      }

      console.log("Formatted task data for API:", taskData);



      const response = await axios.post("http://localhost:5000/tasks", taskData);
      console.log("Task created successfully:", response.data);
      toastManager.addToast("Task created successfully", "success", 5000);
      navigate("/tasks");
    } catch (err: any) {
      console.error("Error creating task:", err);
      console.error("Error details:", err.response?.data);
      console.error("Error stack:", err.stack);
      setSubmitError(err.response?.data?.message || "Failed to create task");
      toastManager.addToast("Error creating task", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Prepare options for select inputs
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

  const userOptions = users.map(user => ({
    value: user._id,
    label: user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username,
  }));

  const projectOptions = projects.map(project => ({
    value: project._id,
    label: project.name,
  }));

  return (
    <div>
      <PageMeta
        title="Create Task | CodevisionPiweb"
        description="Create a new task for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Create Task" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {submitError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
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
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="projectId">Project <span className="text-red-500">*</span></Label>
              <Select
                id="projectId"
                name="projectId"
                options={projectOptions}
                placeholder="Select a project"
                onChange={(value) => handleChange("projectId", value)}
                value={formData.projectId}
              />
              {validationErrors.projectId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.projectId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign To <span className="text-red-500">*</span></Label>
              <Select
                id="assignedTo"
                name="assignedTo"
                options={userOptions}
                placeholder="Select a user"
                onChange={(value) => handleChange("assignedTo", value)}
                value={formData.assignedTo}
              />
              {validationErrors.assignedTo && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.assignedTo}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                options={statusOptions}
                placeholder="Select status"
                onChange={(value) => handleChange("status", value)}
                value={formData.status}
              />
            </div>

            <div>
              <Label htmlFor="taskType">Task Type</Label>
              <Select
                id="taskType"
                name="taskType"
                options={taskTypeOptions}
                placeholder="Select task type"
                onChange={(value) => handleChange("taskType", value)}
                value={formData.taskType}
              />
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
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/tasks")}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
