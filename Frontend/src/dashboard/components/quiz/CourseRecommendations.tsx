import { useState, useEffect } from "react";
import axios from "axios";
import { toastManager } from "../ui/toast/ToastContainer";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

interface OnlineCourse {
  title: string;
  description: string;
  url: string;
  platform: string;
  difficulty: string;
  relevanceScore: number;
  imageUrl?: string;
}

interface CourseRecommendation {
  _id: string;
  user: string;
  quiz: {
    _id: string;
    title: string;
    category: string;
  };
  quizAttempt: string;
  recommendedCourses: OnlineCourse[];
  score: number;
  maxScore: number;
  percentage: number;
  reason: string;
  createdAt: string;
}

interface CourseRecommendationsProps {
  attemptId: string;
  onClose: () => void;
}

export default function CourseRecommendations({ attemptId, onClose }: CourseRecommendationsProps) {
  const [recommendation, setRecommendation] = useState<CourseRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les recommandations pour cette tentative de quiz
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/course-recommendations/attempt/${attemptId}`);
        setRecommendation(response.data);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des recommandations:", error);
        setError("Impossible de charger les recommandations de cours");
        toastManager.addToast({
          title: "Erreur",
          description: "Impossible de charger les recommandations de cours",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [attemptId]);

  // Fonction pour obtenir la couleur du badge en fonction du niveau de difficulté
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Débutant":
        return "success";
      case "Intermédiaire":
        return "primary";
      case "Avancé":
        return "warning";
      case "Expert":
        return "error";
      default:
        return "secondary";
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Rendu du composant
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Chargement des recommandations...</p>
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

  if (!recommendation || recommendation.recommendedCourses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Aucune recommandation de cours disponible pour le moment.
        </p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Recommandations de cours</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Basées sur votre performance au quiz: {recommendation.quiz.title}
            </p>
          </div>
          <div>
            <Badge color="primary">{recommendation.quiz.category}</Badge>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Améliorez vos compétences
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-2">
            Vous avez obtenu un score de {recommendation.percentage}% ({recommendation.score}/{recommendation.maxScore}).
            Voici des cours recommandés pour améliorer vos connaissances dans ce domaine.
          </p>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            {recommendation.reason}
          </p>
        </div>

        <h3 className="text-xl font-semibold mb-4">Cours recommandés</h3>

        <div className="space-y-4">
          {recommendation.recommendedCourses.map((course, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.platform}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <h4 className="text-lg font-semibold">{course.title}</h4>
                </div>
                <Badge color={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center justify-between mt-4">
                <Badge color="secondary">{course.platform}</Badge>
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => window.open(course.url, '_blank')}
                >
                  Voir le cours
                </Button>
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
