import { useState, useEffect } from "react";
import axios from "axios";
import { toastManager } from "../ui/toast/ToastContainer";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import Certificate from "./Certificate";

interface QuizResultsProps {
  attemptId: string;
  onClose: () => void;
  certificateInfo?: {
    certificate: {
      _id: string;
      certificateId: string;
      user: {
        _id: string;
        username: string;
        firstName?: string;
        lastName?: string;
        email: string;
      };
      quiz: {
        _id: string;
        title: string;
        category: string;
      };
      score: number;
      maxScore: number;
      percentage: number;
      issueDate: string;
    };
    newGrade: string;
    oldGrade: string | null;
    gradeUpgraded: boolean;
  };
}

interface QuizAttempt {
  _id: string;
  quiz: {
    _id: string;
    title: string;
    description: string;
    category: string;
  };
  user: {
    _id: string;
    username: string;
    email: string;
  };
  answers: {
    question: {
      _id: string;
      questionText: string;
      questionType: string;
      options: {
        text: string;
        isCorrect: boolean;
      }[];
      correctAnswer: string;
      points: number;
    };
    selectedOption: string;
    textAnswer: string;
    isCorrect: boolean;
  }[];
  score: number;
  maxScore: number;
  completed: boolean;
  startedAt: string;
  completedAt: string;
}

export default function QuizResults({ attemptId, onClose, certificateInfo }: QuizResultsProps) {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [localCertificateInfo, setLocalCertificateInfo] = useState(certificateInfo);

  // Récupérer les détails de la tentative de quiz
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/quiz-attempts/${attemptId}`);
        setAttempt(response.data);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de la tentative:", error);
        setError("Impossible de charger les résultats du quiz");
        toastManager.addToast({
          title: "Erreur",
          description: "Impossible de charger les résultats du quiz",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId]);

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

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Fonction pour obtenir la classe CSS en fonction de la correction
  const getAnswerClass = (isCorrect: boolean) => {
    return isCorrect
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  // Fonction pour obtenir le texte de la réponse sélectionnée
  const getSelectedAnswerText = (answer: QuizAttempt["answers"][0]) => {
    const { question, selectedOption, textAnswer } = answer;

    if (question.questionType === "multiple-choice") {
      const optionIndex = parseInt(selectedOption);
      return question.options[optionIndex]?.text || "Aucune réponse";
    } else if (question.questionType === "true-false") {
      return selectedOption === "true" ? "Vrai" : "Faux";
    } else if (question.questionType === "short-answer") {
      return textAnswer || "Aucune réponse";
    }

    return "Aucune réponse";
  };

  // Fonction pour obtenir le texte de la réponse correcte
  const getCorrectAnswerText = (answer: QuizAttempt["answers"][0]) => {
    const { question } = answer;

    if (question.questionType === "multiple-choice") {
      const correctOption = question.options.find(opt => opt.isCorrect);
      return correctOption?.text || "Aucune réponse correcte définie";
    } else if (question.questionType === "true-false") {
      return question.correctAnswer === "true" ? "Vrai" : "Faux";
    } else if (question.questionType === "short-answer") {
      return question.correctAnswer || "Aucune réponse correcte définie";
    }

    return "Aucune réponse correcte définie";
  };

  // Fonction pour vérifier si l'utilisateur a obtenu un score parfait
  const hasPerfectScore = () => {
    return attempt && attempt.score === attempt.maxScore;
  };

  // Fonction pour générer un certificat si l'utilisateur a obtenu un score parfait
  const generateCertificate = async () => {
    if (!attempt || !hasPerfectScore()) return;

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/certificates/generate', {
        userId: attempt.user._id,
        quizId: attempt.quiz._id,
        attemptId: attempt._id
      });

      setLocalCertificateInfo(response.data);
      setShowCertificate(true);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la génération du certificat:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Impossible de générer le certificat",
        type: "error"
      });
      setLoading(false);
    }
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Chargement des résultats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Aucun résultat trouvé.</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  // Afficher le certificat si disponible
  if (showCertificate && localCertificateInfo) {
    return (
      <Certificate
        certificate={localCertificateInfo.certificate}
        newGrade={localCertificateInfo.newGrade}
        oldGrade={localCertificateInfo.oldGrade}
        gradeUpgraded={localCertificateInfo.gradeUpgraded}
        onClose={() => setShowCertificate(false)}
      />
    );
  }

  const percentage = Math.round((attempt.score / attempt.maxScore) * 100);
  const isPerfectScore = hasPerfectScore();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Résultats du quiz</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{attempt.quiz.title}</p>
          </div>
          <div>
            <Badge color="primary">{attempt.quiz.category}</Badge>
          </div>
        </div>

        {/* Message de félicitations pour un score parfait */}
        {isPerfectScore && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
              Félicitations !
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Vous avez obtenu un score parfait à ce quiz ! Vous pouvez générer un certificat pour célébrer votre réussite.
            </p>
            {localCertificateInfo ? (
              <Button
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowCertificate(true)}
              >
                Voir votre certificat
              </Button>
            ) : (
              <Button
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                onClick={generateCertificate}
              >
                Générer un certificat
              </Button>
            )}
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
              <p className="text-2xl font-bold">{attempt.score}/{attempt.maxScore}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pourcentage</p>
              <p className="text-2xl font-bold">{percentage}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Terminé le</p>
              <p className="text-lg">{formatDate(attempt.completedAt)}</p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">Détail des réponses</h3>

        <div className="space-y-4">
          {attempt.answers.map((answer, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getAnswerClass(answer.isCorrect)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Question {index + 1}</span>
                <Badge color="secondary">{getQuestionTypeLabel(answer.question.questionType)}</Badge>
                <Badge color={answer.isCorrect ? "success" : "error"}>
                  {answer.isCorrect ? "Correcte" : "Incorrecte"}
                </Badge>
              </div>

              <p className="mb-3">{answer.question.questionText}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Votre réponse:</p>
                  <p className={answer.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {getSelectedAnswerText(answer)}
                  </p>
                </div>

                {!answer.isCorrect && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Réponse correcte:</p>
                    <p className="text-green-600 dark:text-green-400">
                      {getCorrectAnswerText(answer)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
