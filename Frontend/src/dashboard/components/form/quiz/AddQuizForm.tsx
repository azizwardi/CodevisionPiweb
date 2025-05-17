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
  title?: string;
  description?: string;
  category?: string;
  formError?: string;
}

interface AddQuizFormProps {
  onSuccess: (quizId?: string) => void;
}

export default function AddQuizForm({ onSuccess }: AddQuizFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    creator: ""
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  // Quiz categories
  const categories = [
    { value: "education", label: "Education" },
    { value: "technology", label: "Technology" },
    { value: "science", label: "Science" },
    { value: "history", label: "History" },
    { value: "geography", label: "Geography" },
    { value: "entertainment", label: "Entertainment" },
    { value: "sports", label: "Sports" },
    { value: "other", label: "Other" }
  ];

  useEffect(() => {
    // Get user ID from JWT token
    const token = localStorage.getItem("authToken");
    console.log("Token retrieved:", token ? "Yes" : "No");

    if (token) {
      try {
        const decodedToken = jwtDecode<{ id: string }>(token);
        console.log("Token decoded:", decodedToken);

        if (decodedToken.id) {
          setFormData(prev => ({
            ...prev,
            creator: decodedToken.id
          }));
          console.log("Creator ID set:", decodedToken.id);
        } else {
          // Use default ID if ID is not available in token
          setFormData(prev => ({
            ...prev,
            creator: "6462d8c1e4b0a6d8e4b0a6d8" // Default ID for testing
          }));
          console.log("Default Creator ID set");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        // Use default ID in case of error
        setFormData(prev => ({
          ...prev,
          creator: "6462d8c1e4b0a6d8e4b0a6d8" // Default ID for testing
        }));
        console.log("Default Creator ID set after error");
      }
    } else {
      // Use default ID if no token is available
      setFormData(prev => ({
        ...prev,
        creator: "6462d8c1e4b0a6d8e4b0a6d8" // Default ID for testing
      }));
      console.log("Default Creator ID set (no token)");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    const errors = { ...validationErrors };

    if (name === "title") {
      // Clear existing error
      delete errors.title;

      // Real-time title validation
      if (value.length > 0 && value.length < 3) {
        errors.title = "Title must contain at least 3 characters";
      } else if (value.length > 100) {
        errors.title = "Title must not exceed 100 characters";
      } else if (value.length > 0 && !/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,?!()]+$/.test(value)) {
        errors.title = "Title contains unauthorized characters";
      }
    } else if (name === "description") {
      // Clear existing error
      delete errors.description;

      // Real-time description validation
      if (value.length > 0 && value.length < 10) {
        errors.description = "Description must contain at least 10 characters";
      } else if (value.length > 500) {
        errors.description = "Description must not exceed 500 characters";
      }
    } else if (validationErrors[name as keyof ValidationErrors]) {
      // For other fields, simply clear the error
      delete errors[name as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value
    });

    // Clear validation error for category
    if (validationErrors.category) {
      setValidationErrors({
        ...validationErrors,
        category: undefined
      });
    }
  };

  // Field validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Quiz title is required";
      isValid = false;
    } else if (formData.title.length < 3) {
      errors.title = "Title must contain at least 3 characters";
      isValid = false;
    } else if (formData.title.length > 100) {
      errors.title = "Title must not exceed 100 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,?!()]+$/.test(formData.title)) {
      // Allows letters, numbers, spaces, accents, hyphens, underscores and basic punctuation
      errors.title = "Title contains unauthorized characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Quiz description is required";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "Description must contain at least 10 characters";
      isValid = false;
    } else if (formData.description.length > 500) {
      errors.description = "Description must not exceed 500 characters";
      isValid = false;
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Please select a category";
      isValid = false;
    }

    // Global verification
    if (!formData.creator) {
      errors.formError = "User identification error. Please log in again.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Sending POST request to http://localhost:5000/quizzes");
      console.log("Data sent:", JSON.stringify(formData, null, 2));

      // Check if creator is defined
      if (!formData.creator) {
        console.error("Missing Creator ID, using default ID");
        formData.creator = "6462d8c1e4b0a6d8e4b0a6d8"; // Default ID
      }

      const response = await axios.post(
        "http://localhost:5000/quizzes",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response received:", response.data);
      toastManager.addToast({
        title: "Success",
        description: "The quiz has been successfully created",
        type: "success",
      });

      // Reset the form
      setFormData({
        title: "",
        description: "",
        category: "",
        creator: formData.creator
      });

      // Call success function with created quiz ID to redirect to question addition
      const createdQuizId = response.data.quiz._id;
      console.log("Created quiz ID:", createdQuizId);
      onSuccess(createdQuizId);
    } catch (error: any) {
      console.error("Error creating quiz:", error);

      // Display additional error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);

        toastManager.addToast({
          title: "Error " + error.response.status,
          description: error.response.data.message || "An error occurred while creating the quiz",
          type: "error",
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);

        toastManager.addToast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check that the backend is running.",
          type: "error",
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Configuration error:", error.message);

        toastManager.addToast({
          title: "Error",
          description: "An error occurred while creating the quiz: " + error.message,
          type: "error",
        });
      }
    } finally {
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

      <div>
        <Label htmlFor="title">Quiz Title <span className="text-red-500">*</span></Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter quiz title"
          error={!!validationErrors.title}
          hint={validationErrors.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
        <TextArea
          id="description"
          name="description"
          value={formData.description}
          onChange={(value) => handleInputChange({ target: { name: "description", value } } as any)}
          placeholder="Describe the content and purpose of this quiz"
          error={!!validationErrors.description}
          hint={validationErrors.description}
          rows={4}
          required
        />
        {!validationErrors.description && (
          <p className="mt-1 text-xs text-gray-500">{formData.description.length}/500 characters</p>
        )}
      </div>

      <div>
        <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
        <Select
          id="category"
          options={categories}
          placeholder="Select a category"
          onChange={handleSelectChange}
          value={formData.category}
          className={validationErrors.category ? "border-red-500" : ""}
          required
        />
        {validationErrors.category && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Information</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          After creating the quiz, you will be able to add questions and answers in the next step.
        </p>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </form>
  );
}
