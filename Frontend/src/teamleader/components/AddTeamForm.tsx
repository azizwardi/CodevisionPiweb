import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import TextArea from "../../dashboard/components/form/input/TextArea";
import Button from "../../dashboard/components/ui/button/Button";

interface AddTeamFormProps {
  onSuccess: () => void;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  formError?: string;
}

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

const AddTeamForm: React.FC<AddTeamFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamLeader: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get the user ID from the token
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        const userId = decoded.id || decoded.user?.id;
        console.log("Decoded token:", decoded);
        console.log("User ID from token:", userId);

        if (userId) {
          setFormData(prev => ({ ...prev, teamLeader: userId }));
        } else {
          console.error("No user ID found in token");
          setValidationErrors({
            formError: "Error authenticating user. User ID not found in token.",
          });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setValidationErrors({
          formError: "Error authenticating user. Please try again later.",
        });
      }
    } else {
      console.error("No token found in localStorage");
      setValidationErrors({
        formError: "Error authenticating user. No authentication token found.",
      });
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user types
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTextAreaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));

    // Clear validation error when user types
    if (validationErrors.description) {
      setValidationErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Team name is required";
      isValid = false;
    }

    if (!formData.teamLeader) {
      errors.formError = "User authentication error. Please try again later.";
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
      // Ensure description is never undefined
      const dataToSend = {
        ...formData,
        description: formData.description || ""
      };

      console.log("Sending data to create team:", dataToSend);

      const response = await axios.post(
        "http://localhost:5000/teams",
        dataToSend,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Team created:", response.data);
      toastManager.addToast({
        title: "Success",
        description: "Team created successfully",
        type: "success",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        teamLeader: formData.teamLeader, // Keep the team leader ID
      });

      // Call the success callback
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationErrors.formError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{validationErrors.formError}</p>
        </div>
      )}

      <div>
        <Label htmlFor="name">Team Name *</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
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
          onChange={handleTextAreaChange}
          placeholder="Enter team description"
          rows={4}
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </form>
  );
};

export default AddTeamForm;
