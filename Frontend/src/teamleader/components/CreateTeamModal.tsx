import React, { useState } from "react";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import TextArea from "../../dashboard/components/form/input/TextArea";
import Button from "../../dashboard/components/ui/button/Button";

interface CreateTeamModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  formError?: string;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  userId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamLeader: userId,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Team name is required";
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
      const response = await axios.post(
        "http://localhost:5000/teams",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Team created:", response.data);
      onSuccess();
    } catch (err: any) {
      console.error("Error creating team:", err);
      setValidationErrors({
        formError: err.response?.data?.message || "Failed to create team",
      });
      toastManager.addToast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create team",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Create New Team
        </h2>
        
        {validationErrors.formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{validationErrors.formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter team name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter team description"
              rows={4}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
