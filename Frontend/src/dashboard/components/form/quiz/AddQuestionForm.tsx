import { useState } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import TextArea from "../input/TextArea";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";
import { Add as FiPlus, Delete as FiTrash2 } from "@mui/icons-material";
import Radio from "../input/Radio";

interface ValidationErrors {
  questionText?: string;
  questionType?: string;
  options?: string;
  correctAnswer?: string;
  points?: string;
  newOption?: string;
  formError?: string;
}

interface AddQuestionFormProps {
  quizId: string;
  onSuccess: (addAnother?: boolean) => void;
  onCancel: () => void;
}

interface Option {
  text: string;
  isCorrect: boolean;
}

export default function AddQuestionForm({ quizId, onSuccess, onCancel }: AddQuestionFormProps) {
  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "multiple-choice",
    options: [] as Option[],
    correctAnswer: "",
    points: 1
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [selectedCorrectOption, setSelectedCorrectOption] = useState<number | null>(null);

  // Types de questions
  const questionTypes = [
    { value: "multiple-choice", label: "Choix multiple" },
    { value: "true-false", label: "Vrai ou Faux" },
    { value: "short-answer", label: "Réponse courte" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Validation en temps réel
    const errors = { ...validationErrors };

    if (name === "questionText") {
      // Effacer l'erreur existante
      delete errors.questionText;

      // Validation du texte de la question en temps réel
      if (value.length > 0 && value.length < 5) {
        errors.questionText = "Le texte de la question doit contenir au moins 5 caractères";
      } else if (value.length > 500) {
        errors.questionText = "Le texte de la question ne doit pas dépasser 500 caractères";
      }
    } else if (name === "correctAnswer") {
      // Effacer l'erreur existante
      delete errors.correctAnswer;

      // Validation de la réponse correcte en temps réel
      if (formData.questionType === "short-answer") {
        if (value.length > 100) {
          errors.correctAnswer = "La réponse correcte ne doit pas dépasser 100 caractères";
        }
      }
    } else if (validationErrors[name as keyof ValidationErrors]) {
      // Pour les autres champs, effacer simplement l'erreur
      delete errors[name as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const handleSelectChange = (value: string) => {
    // Réinitialiser les options si on change de type de question
    let newOptions: Option[] = [];
    let newCorrectAnswer = "";

    if (value === "true-false") {
      // Préremplir avec Vrai/Faux pour ce type
      newOptions = [
        { text: "Vrai", isCorrect: true },
        { text: "Faux", isCorrect: false }
      ];
      setSelectedCorrectOption(0); // "Vrai" est sélectionné par défaut
    }

    setFormData({
      ...formData,
      questionType: value,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    });

    // Effacer l'erreur de validation pour le type de question
    if (validationErrors.questionType) {
      setValidationErrors({
        ...validationErrors,
        questionType: undefined
      });
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData({
        ...formData,
        points: value
      });
    }
  };

  const handleAddOption = () => {
    // Validation de l'option
    if (!newOptionText.trim()) {
      setValidationErrors({
        ...validationErrors,
        newOption: "Le texte de l'option ne peut pas être vide"
      });
      return;
    }

    // Vérifier si l'option existe déjà
    if (formData.options.some(opt => opt.text.trim().toLowerCase() === newOptionText.trim().toLowerCase())) {
      setValidationErrors({
        ...validationErrors,
        newOption: "Cette option existe déjà"
      });
      return;
    }

    // Vérifier la longueur de l'option
    if (newOptionText.length > 200) {
      setValidationErrors({
        ...validationErrors,
        newOption: "L'option ne doit pas dépasser 200 caractères"
      });
      return;
    }

    // Effacer l'erreur de validation pour les options
    const errors = { ...validationErrors };
    delete errors.newOption;
    delete errors.options;
    setValidationErrors(errors);

    const newOption: Option = {
      text: newOptionText,
      isCorrect: false
    };

    setFormData({
      ...formData,
      options: [...formData.options, newOption]
    });

    setNewOptionText("");
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);

    // Ajuster l'index de l'option correcte si nécessaire
    let newSelectedCorrectOption = selectedCorrectOption;
    if (selectedCorrectOption !== null) {
      if (selectedCorrectOption === index) {
        newSelectedCorrectOption = null;
      } else if (selectedCorrectOption > index) {
        newSelectedCorrectOption = selectedCorrectOption - 1;
      }
    }

    setSelectedCorrectOption(newSelectedCorrectOption);

    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const handleSelectCorrectOption = (index: number) => {
    const newOptions = formData.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));

    setSelectedCorrectOption(index);

    setFormData({
      ...formData,
      options: newOptions
    });
  };

  // Fonction de validation des champs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du texte de la question
    if (!formData.questionText.trim()) {
      errors.questionText = "Le texte de la question est requis";
      isValid = false;
    } else if (formData.questionText.length < 5) {
      errors.questionText = "Le texte de la question doit contenir au moins 5 caractères";
      isValid = false;
    } else if (formData.questionText.length > 500) {
      errors.questionText = "Le texte de la question ne doit pas dépasser 500 caractères";
      isValid = false;
    }

    // Validation du type de question
    if (!formData.questionType) {
      errors.questionType = "Le type de question est requis";
      isValid = false;
    }

    // Validation des options pour les questions à choix multiple
    if (formData.questionType === "multiple-choice") {
      if (formData.options.length < 2) {
        errors.options = "Au moins deux options sont requises";
        isValid = false;
      } else if (!formData.options.some(opt => opt.isCorrect)) {
        errors.options = "Veuillez sélectionner une option correcte";
        isValid = false;
      }

      // Vérifier que chaque option a un texte valide
      const invalidOptions = formData.options.filter(opt => opt.text.trim().length < 1);
      if (invalidOptions.length > 0) {
        errors.options = "Toutes les options doivent contenir du texte";
        isValid = false;
      }
    }

    // Validation de la réponse correcte pour les questions à réponse courte
    if (formData.questionType === "short-answer") {
      if (!formData.correctAnswer.trim()) {
        errors.correctAnswer = "La réponse correcte est requise";
        isValid = false;
      } else if (formData.correctAnswer.length > 100) {
        errors.correctAnswer = "La réponse correcte ne doit pas dépasser 100 caractères";
        isValid = false;
      }
    }

    // Validation des points
    if (formData.points < 1) {
      errors.points = "La question doit valoir au moins 1 point";
      isValid = false;
    } else if (formData.points > 10) {
      errors.points = "La question ne peut pas valoir plus de 10 points";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données à envoyer
      const questionData = {
        ...formData
      };

      // Pour les questions à réponse courte, on utilise correctAnswer
      // Pour les questions à choix multiple, on utilise les options avec isCorrect

      const response = await axios.post(
        `http://localhost:5000/quizzes/${quizId}/questions`,
        questionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Réponse reçue:", response.data);
      toastManager.addToast({
        title: "Succès",
        description: "La question a été ajoutée avec succès",
        type: "success",
      });

      // Réinitialiser le formulaire si on ajoute une autre question
      if (addAnother) {
        setFormData({
          questionText: "",
          questionType: "multiple-choice",
          options: [],
          correctAnswer: "",
          points: 1
        });
        setNewOptionText("");
        setSelectedCorrectOption(null);
      }

      // Appeler la fonction de succès
      onSuccess(addAnother);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la question:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la question",
        type: "error",
      });
    } finally {
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

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Ajout de question</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Vous pouvez ajouter plusieurs questions à votre quiz. Après avoir ajouté cette question, vous pourrez en ajouter d'autres.
        </p>
      </div>
      <div>
        <Label htmlFor="questionText">Texte de la question <span className="text-red-500">*</span></Label>
        <TextArea
          id="questionText"
          name="questionText"
          value={formData.questionText}
          onChange={(value) => handleInputChange({ target: { name: "questionText", value } } as any)}
          placeholder="Entrez le texte de votre question"
          error={!!validationErrors.questionText}
          hint={validationErrors.questionText}
          rows={3}
          required
        />
        {!validationErrors.questionText && (
          <p className="mt-1 text-xs text-gray-500">{formData.questionText.length}/500 caractères</p>
        )}
      </div>

      <div>
        <Label htmlFor="questionType">Type de question <span className="text-red-500">*</span></Label>
        <Select
          id="questionType"
          options={questionTypes}
          placeholder="Sélectionnez un type de question"
          onChange={handleSelectChange}
          value={formData.questionType}
          className={validationErrors.questionType ? "border-red-500" : ""}
          required
        />
        {validationErrors.questionType && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.questionType}</p>
        )}
      </div>

      {formData.questionType === "multiple-choice" && (
        <div className="space-y-3">
          <Label>Options de réponse</Label>

          {formData.options.length > 0 && (
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Radio
                    id={`option-${index}`}
                    name="correctOption"
                    value={index.toString()}
                    checked={option.isCorrect}
                    onChange={() => handleSelectCorrectOption(index)}
                    label={option.text}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-1 ml-auto"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {validationErrors.options && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.options}</p>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              value={newOptionText}
              onChange={(e) => {
                setNewOptionText(e.target.value);
                // Effacer l'erreur de validation pour l'option
                if (validationErrors.newOption) {
                  setValidationErrors({
                    ...validationErrors,
                    newOption: undefined
                  });
                }
              }}
              placeholder="Nouvelle option"
              className="flex-1"
              error={!!validationErrors.newOption}
            />
            <Button
              variant="outline"
              type="button"
              onClick={handleAddOption}
              disabled={!newOptionText.trim()}
            >
              <FiPlus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
          {validationErrors.newOption && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.newOption}</p>
          )}

          {formData.options.length === 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">Attention :</span> Vous devez ajouter au moins deux options et sélectionner une réponse correcte.
              </p>
            </div>
          )}
        </div>
      )}

      {formData.questionType === "short-answer" && (
        <div>
          <Label htmlFor="correctAnswer">Réponse correcte <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            id="correctAnswer"
            name="correctAnswer"
            value={formData.correctAnswer}
            onChange={handleInputChange}
            placeholder="Entrez la réponse correcte"
            error={!!validationErrors.correctAnswer}
            hint={validationErrors.correctAnswer}
            required
          />
          {!validationErrors.correctAnswer && (
            <p className="mt-1 text-xs text-gray-500">{formData.correctAnswer.length}/100 caractères</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="points">Points <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          id="points"
          name="points"
          value={formData.points.toString()}
          onChange={handlePointsChange}
          min="1"
          max="10"
          error={!!validationErrors.points}
          hint={validationErrors.points}
          required
        />
        <p className="mt-1 text-xs text-gray-500">Valeur entre 1 et 10 points</p>
      </div>

      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          variant="secondary"
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e as any, true)}
          className="w-full sm:w-auto"
        >
          {loading ? "Ajout en cours..." : "Ajouter et continuer"}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Ajout en cours..." : "Ajouter et terminer"}
        </Button>
      </div>
    </form>
  );
}
