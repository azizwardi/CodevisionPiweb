import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toastManager } from "../ui/toast/ToastContainer";
import { formatDate } from "../../utils/formatDate";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

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
  completed?: boolean;
  score?: {
    score: number;
    maxScore: number;
    percentage: number;
    completedAt: string;
    attemptId: string;
  };
}

interface AvailableQuizzesProps {
  onTakeQuiz: (quizId: string) => void;
}

export default function AvailableQuizzes({ onTakeQuiz }: AvailableQuizzesProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Récupérer l'ID de l'utilisateur à partir du token JWT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Token récupéré:", token ? "Oui" : "Non");

    if (token) {
      try {
        const decodedToken = jwtDecode<any>(token);
        console.log("Token décodé:", decodedToken);

        // Vérifier si l'ID est directement dans le token ou dans un objet user
        let userId;
        if (decodedToken.id) {
          // Format 1: { id: "..." }
          userId = decodedToken.id;
          console.log("ID utilisateur trouvé directement dans le token:", userId);
        } else if (decodedToken.user && decodedToken.user.id) {
          // Format 2: { user: { id: "..." } }
          userId = decodedToken.user.id;
          console.log("ID utilisateur trouvé dans l'objet user du token:", userId);
        } else {
          // Aucun ID trouvé
          console.error("Aucun ID utilisateur trouvé dans le token");
          // Continuer sans ID utilisateur
          setCurrentUserId("unknown");
          return;
        }

        setCurrentUserId(userId);
        console.log("ID utilisateur défini:", userId);
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        // Continuer sans ID utilisateur
        setCurrentUserId("unknown");
      }
    } else {
      console.log("Aucun token trouvé, utilisation d'un ID par défaut");
      // Continuer sans ID utilisateur
      setCurrentUserId("unknown");
    }
  }, []);

  // Récupérer la liste des quiz disponibles
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        console.log("Récupération des quiz avec currentUserId:", currentUserId);

        // Récupérer tous les quiz
        const response = await axios.get("http://localhost:5000/quizzes");
        console.log("Réponse du serveur:", response.data);

        // Afficher tous les quiz sans filtrage pour déboguer
        console.log("Tous les quiz récupérés:", response.data);

        // Vérifier si les quiz ont la propriété creator
        const hasCreator = response.data.every((quiz: any) => quiz.creator && quiz.creator._id);
        console.log("Tous les quiz ont la propriété creator:", hasCreator);

        // Vérifier si les quiz ont la propriété isPublished
        const hasIsPublished = response.data.every((quiz: any) => quiz.isPublished !== undefined);
        console.log("Tous les quiz ont la propriété isPublished:", hasIsPublished);

        // Créer une copie des quiz pour pouvoir les modifier
        const quizzesCopy = [...response.data];

        // Si l'utilisateur est connecté, vérifier quels quiz il a déjà complétés
        if (currentUserId && currentUserId !== "unknown") {
          // Pour chaque quiz, vérifier si l'utilisateur l'a déjà complété
          for (const quiz of quizzesCopy) {
            try {
              const completionResponse = await axios.get(
                `http://localhost:5000/quiz-attempts/check/${currentUserId}/${quiz._id}`
              );

              // Marquer le quiz comme complété si l'utilisateur l'a déjà complété
              if (completionResponse.data.hasCompleted) {
                quiz.completed = true;
                quiz.score = completionResponse.data.score;
                console.log(`Quiz ${quiz.title} déjà complété par l'utilisateur`);
              } else {
                quiz.completed = false;
                console.log(`Quiz ${quiz.title} non complété par l'utilisateur`);
              }
            } catch (error) {
              console.error(`Erreur lors de la vérification du quiz ${quiz._id}:`, error);
              // En cas d'erreur, considérer que le quiz n'est pas complété
              quiz.completed = false;
            }
          }
        }

        // Afficher tous les quiz avec l'information de complétion
        setQuizzes(quizzesCopy);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des quiz:", error);
        setError("Impossible de charger la liste des quiz");
        toastManager.addToast({
          title: "Erreur",
          description: "Impossible de charger la liste des quiz",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    // Exécuter fetchQuizzes dès que currentUserId est défini (même s'il est "unknown")
    if (currentUserId) {
      fetchQuizzes();
    }
  }, [currentUserId]);

  // Fonction pour obtenir le nombre de questions d'un quiz
  const getQuestionCount = (quiz: Quiz) => {
    return quiz.questions ? quiz.questions.length : 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Quiz disponibles</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Chargement des quiz...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Aucun quiz n'est disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold">{quiz.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{quiz.description}</p>

                <div className="flex items-center gap-2 mt-3">
                  <Badge color="primary">{quiz.category}</Badge>
                  <Badge color="secondary">{getQuestionCount(quiz)} question{getQuestionCount(quiz) > 1 ? 's' : ''}</Badge>
                  {quiz.completed && (
                    <Badge color="primary">Complété</Badge>
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <p>Créé par: {quiz.creator && quiz.creator.username ? quiz.creator.username : "Utilisateur inconnu"}</p>
                  <p>Date: {formatDate(quiz.createdAt)}</p>
                </div>

                <div className="mt-4">
                  {quiz.completed ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold mb-2">
                        Votre score: {quiz.score?.score}/{quiz.score?.maxScore} ({quiz.score?.percentage}%)
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onTakeQuiz(quiz._id)}
                        disabled
                      >
                        Déjà complété
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => onTakeQuiz(quiz._id)}
                    >
                      Répondre au quiz
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
