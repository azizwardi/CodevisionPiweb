import { useState, useEffect } from "react";
import axios from "axios";

import { Edit as FiEdit, Delete as FiTrash2, Add as FiPlus } from "@mui/icons-material";
import Button from "../ui/button/Button";
import { toastManager } from "../ui/toast/ToastContainer";
import { formatDate } from "../../utils/formatDate";
import Badge from "../ui/badge/Badge";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
  creator: {
    _id: string;
    username: string;
    email: string;
  };
  questions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface QuizDetailsProps {
  quizId: string;
  onEdit: (quizId: string) => void;
  onAddQuestion: (quizId: string) => void;
  onBack: () => void;
}

export default function QuizDetails({ quizId, onEdit, onAddQuestion, onBack }: QuizDetailsProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les détails du quiz
  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const quizResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}`);
      setQuiz(quizResponse.data);

      // Récupérer les questions du quiz
      const questionsResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}/questions`);
      setQuestions(questionsResponse.data);

      setError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du quiz:", error);
      setError("Impossible de charger les détails du quiz");
    } finally {
      setLoading(false);
    }
  };

  // Charger les détails du quiz au chargement du composant
  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  // Fonction pour supprimer une question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/quizzes/questions/${questionId}`);
      toastManager.addToast({
        title: "Succès",
        description: "La question a été supprimée avec succès",
        type: "success",
      });
      fetchQuizDetails(); // Rafraîchir les données après suppression
    } catch (error) {
      console.error("Erreur lors de la suppression de la question:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la question",
        type: "error",
      });
    }
  };

  // Fonction pour publier un quiz
  const handlePublishQuiz = async () => {
    console.log("Tentative de publication du quiz:", quizId);
    console.log("Nombre de questions:", questions.length);

    if (questions.length === 0) {
      console.log("Impossible de publier un quiz sans questions");
      toastManager.addToast({
        title: "Attention",
        description: "Vous ne pouvez pas publier un quiz sans questions",
        type: "warning",
      });
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir publier ce quiz ? Une fois publié, il sera visible par tous les utilisateurs.")) {
      return;
    }

    try {
      console.log("Envoi de la requête POST à http://localhost:5000/quizzes/" + quizId + "/publish");
      const response = await axios.post(`http://localhost:5000/quizzes/${quizId}/publish`);
      console.log("Réponse reçue:", response.data);

      toastManager.addToast({
        title: "Succès",
        description: "Le quiz a été publié avec succès",
        type: "success",
      });
      fetchQuizDetails(); // Rafraîchir les données après publication
    } catch (error: any) {
      console.error("Erreur lors de la publication du quiz:", error);

      // Afficher des détails supplémentaires sur l'erreur
      if (error.response) {
        console.error("Données de réponse d'erreur:", error.response.data);
        console.error("Statut d'erreur:", error.response.status);

        toastManager.addToast({
          title: "Erreur " + error.response.status,
          description: error.response.data.message || "Une erreur est survenue lors de la publication du quiz",
          type: "error",
        });
      } else if (error.request) {
        console.error("Requête sans réponse:", error.request);

        toastManager.addToast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au serveur. Vérifiez que le backend est en cours d'exécution.",
          type: "error",
        });
      } else {
        console.error("Erreur de configuration:", error.message);

        toastManager.addToast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la publication du quiz: " + error.message,
          type: "error",
        });
      }
    }
  };

  // Fonction pour obtenir le libellé de la catégorie
  const getCategoryLabel = (categoryValue: string): string => {
    const categories: Record<string, string> = {
      "education": "Éducation",
      "technology": "Technologie",
      "science": "Science",
      "history": "Histoire",
      "geography": "Géographie",
      "entertainment": "Divertissement",
      "sports": "Sports",
      "other": "Autre"
    };

    return categories[categoryValue] || categoryValue;
  };

  // Fonction pour obtenir le libellé du type de question
  const getQuestionTypeLabel = (typeValue: string): string => {
    const types: Record<string, string> = {
      "multiple-choice": "Choix multiple",
      "true-false": "Vrai ou Faux",
      "short-answer": "Réponse courte"
    };

    return types[typeValue] || typeValue;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des détails du quiz...</div>;
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || "Quiz non trouvé"}
        <div className="mt-4">
          <Button variant="outline" onClick={onBack}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec les informations du quiz */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(quiz._id)}>
              <FiEdit className="h-4 w-4 mr-1" /> Modifier
            </Button>
            <Button variant="primary" onClick={() => onAddQuestion(quiz._id)}>
              <FiPlus className="h-4 w-4 mr-1" /> Ajouter une question
            </Button>
            {!quiz.isPublished && questions.length > 0 && (
              <Button variant="primary" className="bg-green-600 hover:bg-green-700" onClick={handlePublishQuiz}>
                Publier
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Catégorie</p>
            <p>{getCategoryLabel(quiz.category)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
            <p>
              {quiz.isPublished ? (
                <Badge color="success">Publié</Badge>
              ) : (
                <Badge color="warning">Brouillon</Badge>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Créé le</p>
            <p>{formatDate(quiz.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Liste des questions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Questions ({questions.length})</h3>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Aucune question n'a été ajoutée à ce quiz.</p>
            <Button variant="outline" className="mt-4" onClick={() => onAddQuestion(quiz._id)}>
              <FiPlus className="h-4 w-4 mr-1" /> Ajouter une question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question._id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge color="primary">{getQuestionTypeLabel(question.questionType)}</Badge>
                      <Badge color="secondary">{question.points} point{question.points > 1 ? 's' : ''}</Badge>
                    </div>
                    <p className="mt-2">{question.questionText}</p>

                    {/* Afficher les options pour les questions à choix multiple */}
                    {question.questionType === "multiple-choice" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Options:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex} className={option.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                              {option.text} {option.isCorrect && "(Correcte)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Afficher la réponse correcte pour les questions à réponse courte */}
                    {question.questionType === "short-answer" && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Réponse correcte:</p>
                        <p className="text-green-600 dark:text-green-400 font-medium">{question.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="p-1.5"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de retour */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onBack}>
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}






