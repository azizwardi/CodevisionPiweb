import { useState, useEffect } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import TextArea from "../input/TextArea";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";
import Checkbox from "../input/Checkbox";

interface ValidationErrors {
  title?: string;
  description?: string;
  category?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
  creator: string;
  questions: string[];
}

interface EditQuizFormProps {
  quizId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditQuizForm({ quizId, onSuccess, onCancel }: EditQuizFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    isPublished: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/quizzes/${quizId}`);
        const quiz = response.data;

        setFormData({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          isPublished: quiz.isPublished
        });

        setFetchLoading(false);
      } catch (error) {
        console.error("Error retrieving quiz:", error);
        setError("Unable to load quiz data");
        setFetchLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined
      });
    }
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

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPublished: checked
    });
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
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Quiz description is required";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "Description must contain at least 10 characters";
      isValid = false;
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Please select a category";
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
      const response = await axios.put(
        `http://localhost:5000/quizzes/${quizId}`,
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
        description: "The quiz has been successfully updated",
        type: "success",
      });

      // Call success function to redirect to quiz list
      onSuccess();
    } catch (error) {
      console.error("Error updating quiz:", error);
      toastManager.addToast({
        title: "Error",
        description: "An error occurred while updating the quiz",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center py-4">Loading data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
        <div className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Quiz Title</Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter quiz title"
          error={!!validationErrors.title}
          hint={validationErrors.title}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          name="description"
          value={formData.description}
          onChange={(value) => handleInputChange({ target: { name: "description", value } } as any)}
          placeholder="Describe the content and purpose of this quiz"
          error={!!validationErrors.description}
          hint={validationErrors.description}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          options={categories}
          placeholder="Select a category"
          onChange={handleSelectChange}
          value={formData.category}
          className={validationErrors.category ? "border-red-500" : ""}
        />
        {validationErrors.category && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Checkbox
          checked={formData.isPublished}
          onChange={handleCheckboxChange}
          label="Publish this quiz (visible to all users)"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Updating..." : "Update Quiz"}
        </Button>
      </div>
    </form>
  );
}
