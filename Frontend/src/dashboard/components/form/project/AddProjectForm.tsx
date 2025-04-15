import { useState } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import TextArea from "../input/TextArea";

import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";

interface ValidationErrors {
  name?: string;
  description?: string;
  category?: string;
  startDate?: string;
  deadline?: string;
}

interface AddProjectFormProps {
  onSuccess: () => void;
}

export default function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    startDate: new Date().toISOString().split('T')[0], // Today's date by default
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today + 7 days by default
  });

  const [loading, setLoading] = useState(false);
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

  // Fonction de validation des champs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    console.log("Validating fields:", formData);

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
      console.log("Category error: no category selected");
    }

    // Start date validation
    if (!formData.startDate) {
      errors.startDate = "Start date is required";
      isValid = false;
      console.log("Start date error: date not specified");
    }

    // Deadline validation
    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
      isValid = false;
      console.log("Deadline error: date not specified");
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "Deadline must be after start date";
      isValid = false;
      console.log("Deadline error: date is before start date");
    }

    console.log("Validation result:", { isValid, errors });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("Starting form submission");
    console.log("Form data:", formData);

    // Form validation
    if (!validateForm()) {
      console.log("Validation failed");
      return; // Stop if validation fails
    }

    console.log("Validation successful, sending request");
    setLoading(true);

    try {
      // Pour le débogage, nous n'utilisons pas le token d'authentification
      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("You must be logged in to create a project");
      // }

      console.log("Envoi de la requête POST à http://localhost:8000/projects");
      try {
        const response = await axios.post(
          "http://localhost:8000/projects",
          formData,
          {
            headers: {
              // Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response received:", response.data);
      } catch (axiosError) {
        console.error("Axios error:", axiosError);
        throw axiosError; // Rethrow the error to be handled by the main catch block
      }

      // Display success toast
      toastManager.addToast("Project created successfully", "success", 5000);

      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "",
        startDate: "",
        deadline: "",
      });

      // Notify parent of success
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error | { response?: { data?: { message?: string } } };
      console.error("Error creating project:", error);

      let errorMessage = "Error creating project";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if ('response' in error && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      console.log("Form submission completed");
      setLoading(false);
    }
  };

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

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
