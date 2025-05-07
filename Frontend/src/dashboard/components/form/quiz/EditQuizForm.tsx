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

  // Charger les données du quiz
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
        console.error("Erreur lors de la récupération du quiz:", error);
        setError("Impossible de charger les données du quiz");
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

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isPublished: checked
    });
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
      const response = await axios.put(
        `http://localhost:5000/quizzes/${quizId}`,
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
        description: "Le quiz a été mis à jour avec succès",
        type: "success",
      });

      // Appeler la fonction de succès pour rediriger vers la liste des quiz
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du quiz:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du quiz",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center py-4">Chargement des données...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
        <div className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="flex items-center gap-3 mt-4">
        <Checkbox
          checked={formData.isPublished}
          onChange={handleCheckboxChange}
          label="Publier ce quiz (visible pour tous les utilisateurs)"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Mise à jour en cours..." : "Mettre à jour le quiz"}
        </Button>
      </div>
    </form>
  );
}
