import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import AvailableQuizzes from "../../components/quiz/AvailableQuizzes";
import TakeQuiz from "../../components/quiz/TakeQuiz";
import QuizResults from "../../components/quiz/QuizResults";
import Button from "../../components/ui/button/Button";

export default function QuizParticipation() {
  const [activeTab, setActiveTab] = useState<'list' | 'take' | 'results'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [maxScore, setMaxScore] = useState<number | null>(null);

  // Fonction pour gérer le clic sur "Répondre au quiz" ou "Voir les détails"
  const handleTakeQuiz = (quizId: string, attemptId?: string) => {
    setSelectedQuizId(quizId);

    // Si un ID de tentative est fourni, cela signifie que l'utilisateur veut voir les résultats d'un quiz déjà complété
    if (attemptId) {
      setAttemptId(attemptId);
      setActiveTab('results');
    } else {
      // Sinon, l'utilisateur veut répondre à un nouveau quiz
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
        title="Participation aux Quiz | CodevisionPiweb"
        description="Page de participation aux quiz pour CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Participation aux Quiz" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Quiz disponibles
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Quiz disponibles">
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
