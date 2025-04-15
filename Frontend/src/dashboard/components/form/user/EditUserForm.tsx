import { useState, useEffect } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";

interface ValidationErrors {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
}

interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  isVerified: boolean;
  address?: string;
  avatarUrl?: string;
}

interface EditUserFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({ userId, onSuccess, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "TeamLeader", label: "Team Leader" },
    { value: "user", label: "User" },
  ];

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Chargement de l'utilisateur avec l'ID:", userId);
        setFetchLoading(true);

        // Pour le débogage, nous utilisons l'API showuser pour récupérer tous les utilisateurs
        // puis nous filtrons pour trouver celui qui correspond à l'ID
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Vous devez être connecté pour modifier un utilisateur");
        }

        const response = await axios.get(
          "http://localhost:5000/api/user/showuser",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Trouver l'utilisateur avec l'ID correspondant
        const users = response.data;
        const user = users.find((u: any) => u._id === userId);

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        console.log("Utilisateur trouvé:", user);

        setFormData({
          username: user.username || "",
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role || "",
          phoneNumber: user.phoneNumber || "",
        });
      } catch (err: any) {
        console.error("Erreur lors du chargement de l'utilisateur:", err);
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement de l'utilisateur");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));

    // Effacer l'erreur de validation pour le rôle
    if (validationErrors.role) {
      setValidationErrors(prev => ({
        ...prev,
        role: undefined
      }));
    }
  };

  // Fonction de validation des champs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du nom d'utilisateur
    if (!formData.username.trim()) {
      errors.username = "Le nom d'utilisateur est requis";
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
      isValid = false;
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "L'email n'est pas valide";
      isValid = false;
    }

    // Validation du rôle
    if (!formData.role) {
      errors.role = "Veuillez sélectionner un rôle";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation des champs
    if (!validateForm()) {
      return; // Arrêter si la validation échoue
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Vous devez être connecté pour modifier un utilisateur");
      }

      // Pour le débogage, nous affichons les données que nous allons envoyer
      console.log("Envoi des données pour la modification de l'utilisateur:", {
        userId,
        formData
      });

      const response = await axios.put(
        `http://localhost:5000/api/user/update/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Edit response:", response.data);

      // Display success toast
      toastManager.addToast("User updated successfully", "success", 5000);

      // Notify parent of success
      onSuccess();
    } catch (err: any) {
      console.error("Error updating user:", err);
      const errorMessage = err.response?.data?.message || "Error updating user";
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center p-4">Loading user...</div>;
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter username"
            error={!!validationErrors.username}
            hint={validationErrors.username}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email"
            error={!!validationErrors.email}
            hint={validationErrors.email}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Enter first name"
            error={!!validationErrors.firstName}
            hint={validationErrors.firstName}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Enter last name"
            error={!!validationErrors.lastName}
            hint={validationErrors.lastName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Role</Label>
          <div className="relative">
            <Select
              options={roleOptions}
              placeholder="Select a role"
              onChange={handleRoleChange}
              value={formData.role}
              className={`dark:bg-dark-900 ${validationErrors.role ? 'border-error-500' : ''}`}
            />
            {validationErrors.role && (
              <p className="mt-1.5 text-xs text-error-500">
                {validationErrors.role}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone</Label>
          <Input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            error={!!validationErrors.phoneNumber}
            hint={validationErrors.phoneNumber}
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
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Updating..." : "Update User"}
        </Button>
      </div>
    </form>
  );
}
