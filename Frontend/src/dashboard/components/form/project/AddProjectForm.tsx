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
    startDate: new Date().toISOString().split('T')[0], // Date du jour par défaut
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Date du jour + 7 jours par défaut
    userId: ""
  });

  // Récupérer l'ID de l'utilisateur connecté
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
        console.error("Erreur lors du décodage du token:", error);
      }
    }
  }, []);

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

    // Validation en temps réel
    const errors = { ...validationErrors };

    if (name === "name") {
      // Effacer l'erreur existante
      delete errors.name;

      // Validation du nom en temps réel
      if (value.length > 0 && value.length < 3) {
        errors.name = "Le nom doit contenir au moins 3 caractères";
      } else if (value.length > 50) {
        errors.name = "Le nom ne doit pas dépasser 50 caractères";
      } else if (value.length > 0 && !/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()]+$/.test(value)) {
        errors.name = "Le nom contient des caractères non autorisés";
      }
    } else if (name === "startDate" || name === "deadline") {
      // Effacer les erreurs existantes
      delete errors.startDate;
      delete errors.deadline;

      // Validation des dates en temps réel
      const startDate = name === "startDate" ? new Date(value) : new Date(formData.startDate);
      const deadline = name === "deadline" ? new Date(value) : new Date(formData.deadline);

      if (deadline < startDate) {
        errors.deadline = "La date limite doit être postérieure à la date de début";
      }
    } else if (validationErrors[name as keyof ValidationErrors]) {
      // Pour les autres champs, effacer simplement l'erreur
      delete errors[name as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));

    // Validation en temps réel
    const errors = { ...validationErrors };
    delete errors.description;

    if (value.length > 0 && value.length < 10) {
      errors.description = "La description doit contenir au moins 10 caractères";
    } else if (value.length > 1000) {
      errors.description = "La description ne doit pas dépasser 1000 caractères";
    }

    setValidationErrors(errors);
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
    } else if (!/^[a-zA-Z0-9\s\u00C0-\u017F\-_.,()]+$/.test(formData.name)) {
      // Permet les lettres, chiffres, espaces, accents, tirets, underscores, points, virgules et parenthèses
      errors.name = "Le nom contient des caractères non autorisés";
      isValid = false;
    }

    // Validation de la description
    if (!formData.description.trim()) {
      errors.description = "La description du projet est requise";
      isValid = false;
    } else if (formData.description.length < 10) {
      errors.description = "La description doit contenir au moins 10 caractères";
      isValid = false;
    } else if (formData.description.length > 1000) {
      errors.description = "La description ne doit pas dépasser 1000 caractères";
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
    } else {
      // Vérifier que la date n'est pas dans le passé (avant aujourd'hui)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à minuit
      const startDate = new Date(formData.startDate);

      if (startDate < today) {
        errors.startDate = "La date de début ne peut pas être dans le passé";
        isValid = false;
      }
    }

    // Validation de la date limite
    if (!formData.deadline) {
      errors.deadline = "La date limite est requise";
      isValid = false;
    } else if (formData.startDate && new Date(formData.deadline) < new Date(formData.startDate)) {
      errors.deadline = "La date limite doit être postérieure à la date de début";
      isValid = false;
    }

    // Vérification de l'ID utilisateur
    if (!formData.userId) {
      errors.formError = "Erreur d'identification de l'utilisateur. Veuillez vous reconnecter.";
      isValid = false;
    }

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

      console.log("Envoi de la requête POST à http://localhost:5000/projects");

      // Créer une copie des données du formulaire pour la requête
      const requestData = {
        ...formData,
        // S'assurer que les dates sont au format ISO pour le backend
        startDate: new Date(formData.startDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString()
      };

      console.log("Données formatées pour la requête:", requestData);

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

        console.log("Réponse reçue:", response.data);
      } catch (axiosError) {
        console.error("Erreur Axios:", axiosError);
        throw axiosError; // Relancer l'erreur pour qu'elle soit traitée par le bloc catch principal
      }

      // Afficher un toast de succès
      toastManager.addToast({
        title: "Succès",
        description: "Projet créé avec succès",
        type: "success"
      });

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        description: "",
        category: "",
        startDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userId: formData.userId
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
      toastManager.addToast({
        title: "Erreur",
        description: errorMessage,
        type: "error"
      });
    } finally {
      console.log("Fin de la soumission du formulaire");
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
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Création d'un nouveau projet</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Remplissez tous les champs obligatoires (marqués d'un *) pour créer un nouveau projet.
        </p>
      </div>

      <div>
        <Label htmlFor="name">Nom du projet <span className="text-red-500">*</span></Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Entrez le nom du projet"
          error={!!validationErrors.name}
          hint={validationErrors.name}
          required
        />
        {!validationErrors.name && (
          <p className="mt-1 text-xs text-gray-500">{formData.name.length}/50 caractères</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
        <TextArea
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Décrivez le projet, ses objectifs, et les résultats attendus"
          rows={4}
          error={!!validationErrors.description}
          hint={validationErrors.description}
          required
        />
        {!validationErrors.description && (
          <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 caractères</p>
        )}
      </div>

      <div>
        <Label>Catégorie <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Select
            options={categoryOptions}
            placeholder="Sélectionnez une catégorie"
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
          <Label htmlFor="startDate">Date de début <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            error={!!validationErrors.startDate}
            hint={validationErrors.startDate}
            required
            min={new Date().toISOString().split('T')[0]} // Empêche de sélectionner des dates passées
          />
          <p className="mt-1 text-xs text-gray-500">La date de début doit être aujourd'hui ou une date future</p>
        </div>
        <div>
          <Label htmlFor="deadline">Date limite <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            error={!!validationErrors.deadline}
            hint={validationErrors.deadline}
            required
            min={formData.startDate} // Empêche de sélectionner des dates antérieures à la date de début
          />
          <p className="mt-1 text-xs text-gray-500">La date limite doit être postérieure à la date de début</p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
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
