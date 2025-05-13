import React, { useState, useEffect } from "react";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import TextArea from "../../dashboard/components/form/input/TextArea";
import Button from "../../dashboard/components/ui/button/Button";

interface EditTeamFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  formError?: string;
}

const EditTeamForm: React.FC<EditTeamFormProps> = ({
  teamId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/teams/${teamId}`);
        const team = response.data;

        setFormData({
          name: team.name || "",
          description: team.description || "",
        });
      } catch (err: any) {
        console.error("Error fetching team:", err);
        setValidationErrors({
          formError: err.response?.data?.message || "Failed to fetch team details",
        });
        toastManager.addToast({
          title: "Error",
          description: err.response?.data?.message || "Failed to fetch team details",
          type: "error",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

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
        `http://localhost:5000/teams/${teamId}`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Team updated:", response.data);
      toastManager.addToast({
        title: "Success",
        description: "Team updated successfully",
        type: "success",
      });
      onSuccess();
    } catch (err: any) {
      console.error("Error updating team:", err);
      setValidationErrors({
        formError: err.response?.data?.message || "Failed to update team",
      });
      toastManager.addToast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update team",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Team"}
        </Button>
      </div>
    </form>
  );
};

export default EditTeamForm;
