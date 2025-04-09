import { useState } from "react";
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

interface AddProjectFormProps {
  onSuccess: () => void;
}

export default function AddProjectForm({ onSuccess }: AddProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    startDate: new Date().toISOString().split('T')[0], // Date du jour par défaut
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Date du jour + 7 jours par défaut
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const categoryOptions = [
    { value: "web", label: "Développement Web" },
    { value: "mobile", label: "Développement Mobile" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "other", label: "Autre" },
  ];

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

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));

    // Effacer l'erreur de validation pour la description
    if (validationErrors.description) {
      setValidationErrors(prev => ({
        ...prev,
        description: undefined
      }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));

    // Effacer l'erreur de validation pour la catégorie
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

    console.log("Validation des champs:", formData);

    // Validation du nom
    if (!formData.name.trim()) {
      errors.name = "Le nom du projet est requis";
      isValid = false;
    } else if (formData.name.length < 3) {
      errors.name = "Le nom doit contenir au moins 3 caractères";
      isValid = false;
    } else if (formData.name.length > 50) {
      errors.name = "Le nom ne doit pas dépasser 50 caractères";
      isValid = false;
    }

    // Validation de la description
    if (!formData.description.trim()) {
      errors.description = "La description du projet est requise";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "La description doit contenir au moins 10 caractères";
      isValid = false;
    }

    // Validation de la catégorie
    if (!formData.category) {
      errors.category = "Veuillez sélectionner une catégorie";
      isValid = false;
      console.log("Erreur de catégorie: catégorie non sélectionnée");
    }

    // Validation de la date de début
    if (!formData.startDate) {
      errors.startDate = "La date de début est requise";
      isValid = false;
      console.log("Erreur de date de début: date non spécifiée");
    }

    // Validation de la date limite
    if (!formData.deadline) {
      errors.deadline = "La date limite est requise";
      isValid = false;
      console.log("Erreur de date limite: date non spécifiée");
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "La date limite doit être postérieure à la date de début";
      isValid = false;
      console.log("Erreur de date limite: date antérieure à la date de début");
    }

    console.log("Résultat de la validation:", { isValid, errors });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("Début de la soumission du formulaire");
    console.log("Données du formulaire:", formData);

    // Validation des champs
    if (!validateForm()) {
      console.log("Validation échouée");
      return; // Arrêter si la validation échoue
    }

    console.log("Validation réussie, envoi de la requête");
    setLoading(true);

    try {
      // Pour le débogage, nous n'utilisons pas le token d'authentification
      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("Vous devez être connecté pour créer un projet");
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

        console.log("Réponse reçue:", response.data);
      } catch (axiosError) {
        console.error("Erreur Axios:", axiosError);
        throw axiosError; // Relancer l'erreur pour qu'elle soit traitée par le bloc catch principal
      }

      // Afficher un toast de succès
      toastManager.addToast("Projet créé avec succès", "success", 5000);

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        description: "",
        category: "",
        startDate: "",
        deadline: "",
      });

      // Notifier le parent du succès
      onSuccess();
    } catch (err: any) {
      console.error("Erreur lors de la création du projet:", err);
      console.log("Détails de l'erreur:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });
      const errorMessage = err.response?.data?.message || "Erreur lors de la création du projet";
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      console.log("Fin de la soumission du formulaire");
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
        <Label htmlFor="name">Nom du projet</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Entrez le nom du projet"
          error={!!validationErrors.name}
          hint={validationErrors.name}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <TextArea
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Décrivez le projet"
          rows={4}
          error={!!validationErrors.description}
          hint={validationErrors.description}
        />
      </div>

      <div>
        <Label>Catégorie</Label>
        <div className="relative">
          <Select
            options={categoryOptions}
            placeholder="Sélectionnez une catégorie"
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
          <Label htmlFor="startDate">Date de début</Label>
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
          <Label htmlFor="deadline">Date limite</Label>
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
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Création en cours..." : "Créer le projet"}
        </Button>
      </div>
    </form>
  );
}
