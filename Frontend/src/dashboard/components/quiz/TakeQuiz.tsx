import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toastManager } from "../ui/toast/ToastContainer";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import Radio from "../form/input/Radio";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
  creator: {
    _id: string;
    username: string;
  };
  questions: string[];
}

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  options: {
    text: string;
    isCorrect?: boolean;
  }[];
  points: number;
}

interface TakeQuizProps {
  quizId: string;
  onComplete: (score: number, maxScore: number, attemptId: string, certificateInfo?: any) => void;
  onCancel: () => void;
}

export default function TakeQuiz({ quizId, onComplete, onCancel }: TakeQuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID de l'utilisateur à partir du token JWT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
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
          setError("Impossible de récupérer votre identifiant utilisateur");
          return;
        }

        setUserId(userId);
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        setError("Impossible de récupérer les informations de l'utilisateur");
      }
    } else {
      setError("Vous devez être connecté pour répondre à un quiz");
    }
  }, []);

  // Récupérer les détails du quiz et les questions
  useEffect(() => {
    const fetchQuizAndQuestions = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Vérifier si l'utilisateur a déjà complété ce quiz
        const completionResponse = await axios.get(
          `http://localhost:5000/quiz-attempts/check/${userId}/${quizId}`
        );

        if (completionResponse.data.hasCompleted) {
          // L'utilisateur a déjà complété ce quiz
          setError("Vous avez déjà complété ce quiz");
          toastManager.addToast({
            title: "Quiz déjà complété",
            description: `Vous avez déjà complété ce quiz avec un score de ${completionResponse.data.score.score}/${completionResponse.data.score.maxScore} (${completionResponse.data.score.percentage}%)`,
            type: "warning"
          });
          setLoading(false);
          return;
        }

        // Récupérer les détails du quiz
        const quizResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}`);
        setQuiz(quizResponse.data);

        // Récupérer les questions du quiz
        const questionsResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}/questions`);

        // Supprimer les propriétés isCorrect des options pour ne pas tricher
        const sanitizedQuestions = questionsResponse.data.map((q: Question) => ({
          ...q,
          options: q.options.map(opt => ({ text: opt.text }))
        }));

        setQuestions(sanitizedQuestions);

        // Démarrer une tentative de quiz
        const attemptResponse = await axios.post("http://localhost:5000/quiz-attempts/start", {
          quizId,
          userId
        });

        setAttemptId(attemptResponse.data.attempt._id);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération du quiz:", error);
        setError("Impossible de charger le quiz");
        toastManager.addToast({
          title: "Erreur",
          description: "Impossible de charger le quiz",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchQuizAndQuestions();
    }
  }, [quizId, userId]);

  // Fonction pour gérer la sélection d'une réponse
  const handleAnswerChange = (value: string) => {
    if (!questions[currentQuestionIndex]) return;

    const questionId = questions[currentQuestionIndex]._id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Fonction pour gérer la saisie d'une réponse courte
  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!questions[currentQuestionIndex]) return;

    const questionId = questions[currentQuestionIndex]._id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: e.target.value
    }));
  };

  // Fonction pour soumettre une réponse
  const submitAnswer = async () => {
    if (!questions[currentQuestionIndex] || !attemptId) return;

    const questionId = questions[currentQuestionIndex]._id;
    const answer = answers[questionId];

    if (!answer && answer !== "") {
      toastManager.addToast({
        title: "Attention",
        description: "Veuillez sélectionner une réponse",
        type: "warning"
      });
      return;
    }

    try {
      const question = questions[currentQuestionIndex];

      // Préparer les données à envoyer en fonction du type de question
      let payload;
      if (question.questionType === "multiple-choice" || question.questionType === "true-false") {
        payload = {
          attemptId,
          questionId,
          selectedOption: answer,
          textAnswer: ""
        };
      } else if (question.questionType === "short-answer") {
        payload = {
          attemptId,
          questionId,
          selectedOption: "",
          textAnswer: answer
        };
      }

      // Soumettre la réponse
      await axios.post("http://localhost:5000/quiz-attempts/submit-answer", payload);

      // Passer à la question suivante ou terminer le quiz
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Terminer le quiz
        completeQuiz();
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Impossible de soumettre votre réponse",
        type: "error"
      });
    }
  };

  // Fonction pour terminer le quiz
  const completeQuiz = async () => {
    if (!attemptId) return;

    try {
      setSubmitting(true);

      // Terminer la tentative de quiz
      const response = await axios.post(`http://localhost:5000/quiz-attempts/complete/${attemptId}`);

      // Récupérer le score et les informations du certificat
      const { score, maxScore, percentage, certificateInfo } = response.data;

      toastManager.addToast({
        title: "Quiz terminé",
        description: `Votre score: ${score}/${maxScore} (${percentage}%)`,
        type: "success"
      });

      // Si l'utilisateur a obtenu un score parfait et un certificat a été généré
      if (certificateInfo) {
        console.log("Certificat généré:", certificateInfo);

        // Afficher un message de félicitations
        toastManager.addToast({
          title: "Félicitations !",
          description: certificateInfo.gradeUpgraded
            ? `Vous avez évolué du grade ${certificateInfo.oldGrade} au grade ${certificateInfo.newGrade} !`
            : "Vous avez obtenu un score parfait !",
          type: "success"
        });
      }

      // Appeler la fonction de callback avec le score, l'ID de la tentative et les informations du certificat
      onComplete(score, maxScore, attemptId, certificateInfo);
    } catch (error) {
      console.error("Erreur lors de la finalisation du quiz:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Impossible de finaliser le quiz",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour obtenir le libellé du type de question
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return "Choix multiple";
      case "true-false":
        return "Vrai ou Faux";
      case "short-answer":
        return "Réponse courte";
      default:
        return type;
    }
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Chargement du quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={onCancel}>
          Retour
        </Button>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Ce quiz ne contient pas de questions.</p>
        <Button variant="outline" className="mt-4" onClick={onCancel}>
          Retour
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
          </div>
          <div>
            <Badge color="primary">{quiz.category}</Badge>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="border dark:border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge color="secondary">{getQuestionTypeLabel(currentQuestion.questionType)}</Badge>
            <Badge color="primary">{currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}</Badge>
          </div>

          <h3 className="text-xl font-semibold mb-4">{currentQuestion.questionText}</h3>

          {currentQuestion.questionType === "multiple-choice" && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <Radio
                    id={`option-${index}`}
                    name="quiz-option"
                    value={index.toString()}
                    checked={answers[currentQuestion._id] === index.toString()}
                    onChange={() => handleAnswerChange(index.toString())}
                    label={option.text}
                  />
                </div>
              ))}
            </div>
          )}

          {currentQuestion.questionType === "true-false" && (
            <div className="space-y-3">
              <div className="flex items-center">
                <Radio
                  id="option-true"
                  name="quiz-option"
                  value="true"
                  checked={answers[currentQuestion._id] === "true"}
                  onChange={() => handleAnswerChange("true")}
                  label="Vrai"
                />
              </div>
              <div className="flex items-center">
                <Radio
                  id="option-false"
                  name="quiz-option"
                  value="false"
                  checked={answers[currentQuestion._id] === "false"}
                  onChange={() => handleAnswerChange("false")}
                  label="Faux"
                />
              </div>
            </div>
          )}

          {currentQuestion.questionType === "short-answer" && (
            <div>
              <input
                type="text"
                className="w-full p-2 border dark:border-gray-700 rounded-lg dark:bg-gray-800"
                placeholder="Votre réponse..."
                value={answers[currentQuestion._id] || ""}
                onChange={handleTextAnswerChange}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Abandonner
          </Button>
          <Button
            variant="primary"
            onClick={submitAnswer}
            disabled={submitting}
          >
            {currentQuestionIndex < questions.length - 1 ? "Question suivante" : "Terminer le quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
