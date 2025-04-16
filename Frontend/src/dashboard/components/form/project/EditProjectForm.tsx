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
}

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  deadline: string;
  creator?: string;
}

interface EditProjectFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditProjectForm({ projectId, onSuccess, onCancel }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    startDate: "",
    deadline: "",
    userId: ""
  });

  const [isCreator, setIsCreator] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  // Charger les données du projet
  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Récupérer le token d'authentification
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Vous devez être connecté pour modifier un projet");
        }

        // Décoder le token pour obtenir l'ID utilisateur
        interface DecodedToken {
          user?: {
            id: string;
          };
          id?: string;
        }

        const decodedToken = jwtDecode<DecodedToken>(token);
        const userId = decodedToken.user?.id || decodedToken.id;

        if (!userId) {
          throw new Error("Impossible d'identifier l'utilisateur");
        }

        const response = await axios.get(
          `http://localhost:8000/projects/${projectId}`
        );

        const project = response.data;

        // Vérifier si l'utilisateur est le créateur du projet
        if (project.creator && project.creator !== userId) {
          setIsCreator(false);
        }

        // Formater les dates pour l'input date
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        setFormData({
          name: project.name,
          description: project.description,
          category: project.category,
          startDate: formatDate(project.startDate),
          deadline: formatDate(project.deadline),
          userId
        });
      } catch (err: any) {
        console.error("Erreur lors du chargement du projet:", err);
        setError(err.response?.data?.message || "Erreur lors du chargement du projet");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

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
    }
    // Validation de la date de début
    if (!formData.startDate) {
      errors.startDate = "La date de début est requise";
      isValid = false;
    }
    // Validation de la date limite
    if (!formData.deadline) {
      errors.deadline = "La date limite est requise";
      isValid = false;
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "La date limite doit être postérieure à la date de début";
      isValid = false;
    }
    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Vérifier si l'utilisateur est le créateur
    if (!isCreator) {
      setError("Vous n'êtes pas autorisé à modifier ce projet");
      toastManager.addToast("Vous n'êtes pas autorisé à modifier ce projet", "error", 5000);
      return;
    }

    // Validation des champs
    if (!validateForm()) {
      return; // Arrêter si la validation échoue
    }
    
    setLoading(true);

    try {
      // Pour le débogage, nous n'utilisons pas le token d'authentification
      // const token = localStorage.getItem("authToken");
      // if (!token) {
      //   throw new Error("Vous devez être connecté pour modifier un projet");
      // }

      const response = await axios.put(
        `http://localhost:8000/projects/${projectId}`,
        formData,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Afficher un toast de succès
      toastManager.addToast("Projet modifié avec succès", "success", 5000);
      
      // Notifier le parent du succès
      onSuccess();
    } catch (err: any) {
      console.error("Erreur lors de la modification du projet:", err);

      // Vérifier si l'erreur est due à un problème d'autorisation
      if (err.response?.status === 403) {
        setIsCreator(false);
      }

      const errorMessage = err.response?.data?.message || "Erreur lors de la modification du projet";
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center p-4">Chargement du projet...</div>;
  }

  // Afficher un message si l'utilisateur n'est pas le créateur
  if (!isCreator) {
    return (
      <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
        <h3 className="text-lg font-semibold text-error-700 mb-2">Accès refusé</h3>
        <p className="text-error-600 mb-4">Vous n'êtes pas autorisé à modifier ce projet car vous n'en êtes pas le créateur.</p>
        <Button variant="outline" onClick={onCancel}>Retour</Button>
      </div>
    );
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

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Modification en cours..." : "Modifier le projet"}
        </Button>
      </div>
    </form>
  );
}
