import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import AvailableQuizzes from "../../components/quiz/AvailableQuizzes";
import TakeQuiz from "../../components/quiz/TakeQuiz";
import QuizResults from "../../components/quiz/QuizResults";
import Button from "../../components/ui/button/Button";

export default function QuizParticipation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'take' | 'results'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [maxScore, setMaxScore] = useState<number | null>(null);

  // Vérifier si l'utilisateur est un administrateur
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      // Rediriger vers la page "Unauthorized" si l'utilisateur est un administrateur
      navigate("/unauthorized");
    }
  }, [navigate]);

  // Fonction pour gérer le clic sur "Répondre au quiz" ou "Voir les détails"
  const handleTakeQuiz = (quizId: string, attemptId?: string) => {
    console.log(`handleTakeQuiz called with quizId: ${quizId}, attemptId: ${attemptId || 'none'}`);
    setSelectedQuizId(quizId);

    // Si un ID de tentative est fourni, cela signifie que l'utilisateur veut voir les résultats d'un quiz déjà complété
    if (attemptId) {
      console.log('Viewing quiz results');
      setAttemptId(attemptId);
      setActiveTab('results');
    } else {
      // Accéder directement au quiz
      console.log('Accessing quiz directly');
      setActiveTab('take');
    }
  };

  // État pour stocker les informations du certificat
  const [certificateInfo, setCertificateInfo] = useState<any>(null);

  // Fonction pour gérer la fin d'un quiz
  const handleQuizComplete = (score: number, maxScore: number, attemptId: string, certInfo?: any) => {
    setScore(score);
    setMaxScore(maxScore);
    setAttemptId(attemptId);
    setCertificateInfo(certInfo || null);
    setActiveTab('results');
  };

  // Fonction pour revenir à la liste des quiz
  const handleBackToList = () => {
    setSelectedQuizId(null);
    setAttemptId(null);
    setScore(null);
    setMaxScore(null);
    setActiveTab('list');
  };

  return (
    <div>
      <PageMeta
        title="Participation in Quizzes | CodevisionPiweb"
        description="Quiz participation page for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Participation in Quiz" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Quizzes available
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Available quizzes">
          <AvailableQuizzes onTakeQuiz={handleTakeQuiz} />
        </ComponentCard>
      )}



      {activeTab === 'take' && selectedQuizId && (
        <ComponentCard title="Répondre au quiz">
          <TakeQuiz
            quizId={selectedQuizId}
            onComplete={(score, maxScore, attemptId) => handleQuizComplete(score, maxScore, attemptId)}
            onCancel={handleBackToList}
          />
        </ComponentCard>
      )}

      {activeTab === 'results' && attemptId && (
        <ComponentCard title="Résultats du quiz">
          <QuizResults
            attemptId={attemptId}
            onClose={handleBackToList}
            certificateInfo={certificateInfo}
          />
        </ComponentCard>
      )}
    </div>
  );
}
