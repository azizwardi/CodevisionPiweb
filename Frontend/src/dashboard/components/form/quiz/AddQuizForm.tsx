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

  // Catégories de quiz
  const categories = [
    { value: "education", label: "Éducation" },
    { value: "technology", label: "Technologie" },
    { value: "science", label: "Science" },
    { value: "history", label: "Histoire" },
    { value: "geography", label: "Géographie" },
    { value: "entertainment", label: "Divertissement" },
    { value: "sports", label: "Sports" },
    { value: "other", label: "Autre" }
  ];

  useEffect(() => {
    // Récupérer l'ID de l'utilisateur à partir du token JWT
    const token = localStorage.getItem("authToken");
    console.log("Token récupéré:", token ? "Oui" : "Non");

    if (token) {
      try {
        const decodedToken = jwtDecode<{ id: string }>(token);
        console.log("Token décodé:", decodedToken);

        if (decodedToken.id) {
          setFormData(prev => ({
            ...prev,
            creator: decodedToken.id
          }));
          console.log("Creator ID défini:", decodedToken.id);
        } else {
          // Utiliser un ID par défaut si l'ID n'est pas disponible dans le token
          setFormData(prev => ({
            ...prev,
            creator: "6462d8c1e4b0a6d8e4b0a6d8" // ID par défaut pour les tests
          }));
          console.log("Creator ID par défaut défini");
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        // Utiliser un ID par défaut en cas d'erreur
        setFormData(prev => ({
          ...prev,
          creator: "6462d8c1e4b0a6d8e4b0a6d8" // ID par défaut pour les tests
        }));
        console.log("Creator ID par défaut défini après erreur");
      }
    } else {
      // Utiliser un ID par défaut si aucun token n'est disponible
      setFormData(prev => ({
        ...prev,
        creator: "6462d8c1e4b0a6d8e4b0a6d8" // ID par défaut pour les tests
      }));
      console.log("Creator ID par défaut défini (pas de token)");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Effacer l'erreur de validation pour ce champ
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

    // Effacer l'erreur de validation pour la catégorie
    if (validationErrors.category) {
      setValidationErrors({
        ...validationErrors,
        category: undefined
      });
    }
  };

  // Fonction de validation des champs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du titre
    if (!formData.title.trim()) {
      errors.title = "Le titre du quiz est requis";
      isValid = false;
    } else if (formData.title.length < 3) {
      errors.title = "Le titre doit contenir au moins 3 caractères";
      isValid = false;
    } else if (formData.title.length > 100) {
      errors.title = "Le titre ne doit pas dépasser 100 caractères";
      isValid = false;
    }

    // Validation de la description
    if (!formData.description.trim()) {
      errors.description = "La description du quiz est requise";
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
      console.log("Envoi de la requête POST à http://localhost:5000/quizzes");
      console.log("Données envoyées:", JSON.stringify(formData, null, 2));

      // Vérifier si creator est défini
      if (!formData.creator) {
        console.error("Creator ID manquant, utilisation d'un ID par défaut");
        formData.creator = "6462d8c1e4b0a6d8e4b0a6d8"; // ID par défaut
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

      console.log("Réponse reçue:", response.data);
      toastManager.addToast({
        title: "Succès",
        description: "Le quiz a été créé avec succès",
        type: "success",
      });

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        description: "",
        category: "",
        creator: formData.creator
      });

      // Appeler la fonction de succès avec l'ID du quiz créé pour rediriger vers l'ajout de questions
      const createdQuizId = response.data.quiz._id;
      console.log("ID du quiz créé:", createdQuizId);
      onSuccess(createdQuizId);
    } catch (error: any) {
      console.error("Erreur lors de la création du quiz:", error);

      // Afficher des détails supplémentaires sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui n'est pas dans la plage 2xx
        console.error("Données de réponse d'erreur:", error.response.data);
        console.error("Statut d'erreur:", error.response.status);
        console.error("En-têtes d'erreur:", error.response.headers);

        toastManager.addToast({
          title: "Erreur " + error.response.status,
          description: error.response.data.message || "Une erreur est survenue lors de la création du quiz",
          type: "error",
        });
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Requête sans réponse:", error.request);

        toastManager.addToast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au serveur. Vérifiez que le backend est en cours d'exécution.",
          type: "error",
        });
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration:", error.message);

        toastManager.addToast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la création du quiz: " + error.message,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre du Quiz</Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Entrez le titre du quiz"
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
          placeholder="Décrivez le contenu et l'objectif de ce quiz"
          error={!!validationErrors.description}
          hint={validationErrors.description}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Select
          id="category"
          options={categories}
          placeholder="Sélectionnez une catégorie"
          onChange={handleSelectChange}
          value={formData.category}
          className={validationErrors.category ? "border-red-500" : ""}
        />
        {validationErrors.category && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Information</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Après avoir créé le quiz, vous pourrez ajouter des questions et des réponses dans l'étape suivante.
        </p>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Création en cours..." : "Créer le quiz"}
        </Button>
      </div>
    </form>
  );
}
