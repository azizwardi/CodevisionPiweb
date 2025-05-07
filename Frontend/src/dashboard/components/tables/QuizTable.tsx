import { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiEye, FiPlus } from "react-icons/fi";
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

interface QuizTableProps {
  onEdit: (quizId: string) => void;
  onView: (quizId: string) => void;
  onAddQuestion: (quizId: string) => void;
  refreshTrigger: number;
}

export default function QuizTable({ onEdit, onView, onAddQuestion, refreshTrigger }: QuizTableProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer la liste des quiz
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/quizzes");
      setQuizzes(response.data);
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des quiz:", error);
      setError("Impossible de charger la liste des quiz");
    } finally {
      setLoading(false);
    }
  };

  // Charger les quiz au chargement du composant et lorsque refreshTrigger change
  useEffect(() => {
    fetchQuizzes();
  }, [refreshTrigger]);

  // Fonction pour supprimer un quiz
  const handleDelete = async (quizId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/quizzes/${quizId}`);
      toastManager.addToast({
        title: "Succès",
        description: "Le quiz a été supprimé avec succès",
        type: "success",
      });
      fetchQuizzes(); // Rafraîchir la liste après suppression
    } catch (error) {
      console.error("Erreur lors de la suppression du quiz:", error);
      toastManager.addToast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du quiz",
        type: "error",
      });
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

  if (loading && quizzes.length === 0) {
    return <div className="text-center py-8">Chargement des quiz...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
        <div className="mt-4">
          <Button variant="outline" onClick={fetchQuizzes}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">Aucun quiz n'a été créé pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-5 font-medium">Titre</th>
            <th className="px-4 py-5 font-medium">Catégorie</th>
            <th className="px-4 py-5 font-medium">Questions</th>
            <th className="px-4 py-5 font-medium">Statut</th>
            <th className="px-4 py-5 font-medium">Date de création</th>
            <th className="px-4 py-5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((quiz) => (
            <tr
              key={quiz._id}
              className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900/40"
            >
              <td className="px-4 py-4">
                <div className="font-medium">{quiz.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {quiz.description.length > 50
                    ? `${quiz.description.substring(0, 50)}...`
                    : quiz.description}
                </div>
              </td>
              <td className="px-4 py-4">{getCategoryLabel(quiz.category)}</td>
              <td className="px-4 py-4">{quiz.questions.length}</td>
              <td className="px-4 py-4">
                {quiz.isPublished ? (
                  <Badge color="success">Publié</Badge>
                ) : (
                  <Badge color="warning">Brouillon</Badge>
                )}
              </td>
              <td className="px-4 py-4">{formatDate(quiz.createdAt)}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(quiz._id)}
                    className="p-1.5"
                  >
                    <FiEye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(quiz._id)}
                    className="p-1.5"
                  >
                    <FiEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddQuestion(quiz._id)}
                    className="p-1.5"
                  >
                    <FiPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(quiz._id)}
                    className="p-1.5"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
