import { useState, useEffect } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import TextArea from "../input/TextArea";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";

interface ValidationErrors {
  name?: string;
  description?: string;
  category?: string;
  startDate?: string;
  deadline?: string;
}

// Type for project data retrieved from the API
type ProjectData = {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  deadline: string;
}

interface EditProjectFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditProjectForm({ projectId, onSuccess, onCancel }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    startDate: "",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const categoryOptions = [
    { value: "web", label: "Web Development" },
    { value: "mobile", label: "Mobile Development" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "other", label: "Other" },
  ];

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        // For debugging, we're not using the authentication token
        // const token = localStorage.getItem("authToken");
        // if (!token) {
        //   throw new Error("You must be logged in to edit a project");
        // }

        const response = await axios.get(
          `http://localhost:8000/projects/${projectId}`,
          {
            // headers: {
            //   Authorization: `Bearer ${token}`,
            // },
          }
        );

        const project: ProjectData = response.data;

        // Format dates for the date input
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        setFormData({
          name: project.name,
          description: project.description,
          category: project.category,
          startDate: formatDate(project.startDate),
          deadline: formatDate(project.deadline),
        });
      } catch (err: unknown) {
        const error = err as Error | { response?: { data?: { message?: string } } };
        console.error("Error loading project:", err);
        const errorMessage = 'response' in error && error.response?.data?.message
          ? error.response.data.message
          : "Error loading project";
        setError(errorMessage);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));

    // Clear validation error for description
    if (validationErrors.description) {
      setValidationErrors(prev => ({
        ...prev,
        description: undefined
      }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));

    // Clear validation error for category
    if (validationErrors.category) {
      setValidationErrors(prev => ({
        ...prev,
        category: undefined
      }));
    }
  };

  // Form validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Project name is required";
      isValid = false;
    } else if (formData.name.length < 3) {
      errors.name = "Name must be at least 3 characters";
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = "Name must not exceed 50 characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Project description is required";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
      isValid = false;
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Please select a category";
      isValid = false;
    }

    // Start date validation
    if (!formData.startDate) {
      errors.startDate = "Start date is required";
      isValid = false;
    }

    // Deadline validation
    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
      isValid = false;
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "Deadline must be after start date";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Form validation
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    setLoading(true);

    try {
      // For debugging, we're not using the authentication token
      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("You must be logged in to edit a project");
      // }

      await axios.put(
        `http://localhost:8000/projects/${projectId}`,
        formData,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Display success toast
      toastManager.addToast("Project updated successfully", "success", 5000);

      // Notify parent of success
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error | { response?: { data?: { message?: string } } };
      console.error("Error updating project:", err);
      const errorMessage = 'response' in error && error.response?.data?.message
        ? error.response.data.message
        : "Error updating project";
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center p-4">Loading project...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 mb-4 text-sm text-white bg-error-500 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 mb-4 text-sm text-white bg-success-500 rounded-lg">
          {success}
        </div>
      )}

      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter project name"
          error={!!validationErrors.name}
          hint={validationErrors.name}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Describe your project"
          rows={4}
          error={!!validationErrors.description}
          hint={validationErrors.description}
        />
      </div>

      <div>
        <Label>Category</Label>
        <div className="relative">
          <Select
            options={categoryOptions}
            placeholder="Select a category"
            onChange={handleCategoryChange}
            value={formData.category}
            className={`dark:bg-dark-900 ${validationErrors.category ? 'border-error-500' : ''}`}
          />
          {validationErrors.category && (
            <p className="mt-1.5 text-xs text-error-500">
              {validationErrors.category}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            error={!!validationErrors.startDate}
            hint={validationErrors.startDate}
          />
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            error={!!validationErrors.deadline}
            hint={validationErrors.deadline}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Updating..." : "Update Project"}
        </button>
      </div>
    </form>
  );
}
