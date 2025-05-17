import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
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
  formError?: string;
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
    userId: ""
  });

  // Get the connected user's ID
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        interface DecodedToken {
          user?: {
            id: string;
          };
          id?: string;
        }

        const decodedToken = jwtDecode<DecodedToken>(token);
        const userId = decodedToken.user?.id || decodedToken.id;

        if (userId) {
          setFormData(prev => ({ ...prev, userId }));
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

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

    // Real-time validation
    const errors = { ...validationErrors };

    if (name === "name") {
      // Clear existing error
      delete errors.name;

      // Real-time name validation
      if (value.length > 0 && value.length < 3) {
        errors.name = "Name must contain at least 3 characters";
      } else if (value.length > 50) {
        errors.name = "Name must not exceed 50 characters";
      } else if (value.length > 0 && !/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()]+$/.test(value)) {
        errors.name = "Name contains unauthorized characters";
      }
    } else if (name === "startDate" || name === "deadline") {
      // Clear existing errors
      delete errors.startDate;
      delete errors.deadline;

      // Real-time date validation
      const startDate = name === "startDate" ? new Date(value) : new Date(formData.startDate);
      const deadline = name === "deadline" ? new Date(value) : new Date(formData.deadline);

      if (deadline < startDate) {
        errors.deadline = "The deadline must be after the start date";
      }
    } else if (validationErrors[name as keyof ValidationErrors]) {
      // For other fields, simply clear the error
      delete errors[name as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));

    // Real-time validation
    const errors = { ...validationErrors };
    delete errors.description;

    if (value.length > 0 && value.length < 10) {
      errors.description = "Description must contain at least 10 characters";
    } else if (value.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }

    setValidationErrors(errors);
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

  // Field validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Project name is required";
      isValid = false;
    } else if (formData.name.length < 3) {
      errors.name = "Name must contain at least 3 characters";
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = "Name must not exceed 50 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()]+$/.test(formData.name)) {
      // Allows letters, numbers, spaces, accents, hyphens, underscores, periods, commas, and parentheses
      errors.name = "Name contains unauthorized characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Project description is required";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "Description must contain at least 10 characters";
      isValid = false;
    } else if (formData.description.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
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
    } else {
      // Check that the date is not in the past (before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight
      const startDate = new Date(formData.startDate);

      if (startDate < today) {
        errors.startDate = "The start date cannot be in the past";
        isValid = false;
      }
    }

    // Deadline validation
    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
      isValid = false;
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "The deadline must be after the start date";
      isValid = false;
    }

    // User ID verification
    if (!formData.userId) {
      errors.formError = "User identification error. Please log in again.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("Start of form submission");
    console.log("Form data:", formData);

    // Field validation
    if (!validateForm()) {
      console.log("Validation failed");
      return; // Stop if validation fails
    }

    console.log("Validation successful, sending the request");
    setLoading(true);

    try {
      // For debugging, we're not using the authentication token
      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("You must be logged in to create a project");
      // }

      console.log("Sending POST request to http://localhost:5000/projects");

      // Create a copy of the form data for the request
      const requestData = {
        ...formData,
        // Ensure dates are in ISO format for the backend
        startDate: new Date(formData.startDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString()
      };

      console.log("Formatted data for the request:", requestData);

      try {
        const response = await axios.post(
          "http://localhost:5000/projects",
          requestData,
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

      // Display a success toast
      toastManager.addToast({
        title: "Success",
        description: "Project created successfully",
        type: "success"
      });

      // Reset the form
      setFormData({
        name: "",
        description: "",
        category: "",
        startDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userId: formData.userId
      });

      // Notify the parent of success
      onSuccess();
    } catch (err: any) {
      console.error("Error creating project:", err);
      console.log("Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });
      const errorMessage = err.response?.data?.message || "Error creating project";
      setError(errorMessage);
      toastManager.addToast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
    } finally {
      console.log("End of form submission");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationErrors.formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{validationErrors.formError}</p>
        </div>
      )}

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

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Create a new project</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Fill in all required fields (marked with *) to create a new project.
        </p>
      </div>

      <div>
        <Label htmlFor="name">Project name <span className="text-red-500">*</span></Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter project name"
          error={!!validationErrors.name}
          hint={validationErrors.name}
          required
        />
        {!validationErrors.name && (
          <p className="mt-1 text-xs text-gray-500">{formData.name.length}/50 characters</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
        <TextArea
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Describe the project, its objectives, and expected results"
          rows={4}
          error={!!validationErrors.description}
          hint={validationErrors.description}
          required
        />
        {!validationErrors.description && (
          <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 characters</p>
        )}
      </div>

      <div>
        <Label>Category <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Select
            options={categoryOptions}
            placeholder="Select a category"
            onChange={handleCategoryChange}
            value={formData.category}
            className={`dark:bg-dark-900 ${validationErrors.category ? 'border-error-500' : ''}`}
            required
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
          <Label htmlFor="startDate">Start date <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            error={!!validationErrors.startDate}
            hint={validationErrors.startDate}
            required
            min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates
          />
          <p className="mt-1 text-xs text-gray-500">Start date must be today or a future date</p>
        </div>
        <div>
          <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            error={!!validationErrors.deadline}
            hint={validationErrors.deadline}
            required
            min={formData.startDate} // Prevents selecting dates before the start date
          />
          <p className="mt-1 text-xs text-gray-500">Deadline must be after the start date</p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Creating..." : "Create project"}
        </Button>
      </div>
    </form>
  );
}
