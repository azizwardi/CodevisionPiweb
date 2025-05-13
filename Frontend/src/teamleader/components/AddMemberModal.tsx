import React, { useState } from "react";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import Button from "../../dashboard/components/ui/button/Button";

interface AddMemberModalProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  email?: string;
  formError?: string;
}

interface Skill {
  skill: string;
  level: number;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  teamId,
  teamName,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<number>(1);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear validation error when user types
    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Basic email validation
    if (!email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { skill: newSkill.trim(), level: newSkillLevel }]);
      setNewSkill("");
      setNewSkillLevel(1);
    }
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills.splice(index, 1);
    setSkills(updatedSkills);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:5000/teams/${teamId}/members`,
        {
          email,
          skills
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Member added:", response.data);
      onSuccess();
    } catch (err: any) {
      console.error("Error adding member:", err);
      setValidationErrors({
        formError: err.response?.data?.message || "Failed to add member",
      });
      toastManager.addToast({
        title: "Error",
        description: err.response?.data?.message || "Failed to add member",
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
          Add Member to {teamName}
        </h2>
        
        {validationErrors.formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{validationErrors.formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Member Email *</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter member email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: The email must belong to a user with the 'Member' role.
            </p>
          </div>
          
          <div>
            <Label>Member Skills</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill name"
                className="flex-grow"
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
              >
                Add
              </Button>
            </div>
            
            {skills.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label>Added Skills:</Label>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{skill.skill} (Level {skill.level})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
