import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import AddQuizForm from "../../components/form/quiz/AddQuizForm";
import EditQuizForm from "../../components/form/quiz/EditQuizForm";
import QuizTable from "../../components/tables/QuizTable";
import QuizDetails from "../../components/quiz/QuizDetails";
import AddQuestionForm from "../../components/form/quiz/AddQuestionForm";
import Button from "../../components/ui/button/Button";

export default function QuizManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit' | 'view' | 'add-question'>('list');
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleAddSuccess = (quizId: string) => {
    // Si un ID de quiz est fourni, rediriger vers le formulaire d'ajout de question
    if (quizId) {
      setSelectedQuizId(quizId);
      setActiveTab('add-question');
    } else {
      // Sinon, revenir à la liste des quiz
      setActiveTab('list');
    }
    // Déclencher un rafraîchissement de la liste des quiz
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setActiveTab('list');
    // Déclencher un rafraîchissement de la liste des quiz
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddQuestionSuccess = (addAnother: boolean = false) => {
    if (addAnother) {
      // Rester sur le formulaire d'ajout de question pour en ajouter une autre
      // Juste rafraîchir les données
      setRefreshTrigger(prev => prev + 1);
    } else {
      // Retourner à la vue détaillée du quiz après avoir ajouté une question
      setActiveTab('view');
      // Déclencher un rafraîchissement des données
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleEditClick = (quizId: string) => {
    setSelectedQuizId(quizId);
    setActiveTab('edit');
  };

  const handleViewClick = (quizId: string) => {
    setSelectedQuizId(quizId);
    setActiveTab('view');
  };

  const handleAddQuestionClick = (quizId: string) => {
    setSelectedQuizId(quizId);
    setActiveTab('add-question');
  };

  const handleCancelEdit = () => {
    setActiveTab('list');
    setSelectedQuizId("");
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedQuizId("");
  };

  const handleCancelAddQuestion = () => {
    // Si on était en train de visualiser un quiz, retourner à la vue détaillée
    if (selectedQuizId) {
      setActiveTab('view');
    } else {
      setActiveTab('list');
    }
  };

  return (
    <div>
      <PageMeta
        title="Gestion des Quiz | CodevisionPiweb"
        description="Page de gestion des quiz pour CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Gestion des Quiz" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Liste des Quiz
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Créer un Quiz
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Liste des Quiz">
          <QuizTable
            onEdit={handleEditClick}
            onView={handleViewClick}
            onAddQuestion={handleAddQuestionClick}
            refreshTrigger={refreshTrigger}
          />
        </ComponentCard>
      )}

      {activeTab === 'add' && (
        <ComponentCard title="Créer un Nouveau Quiz">
          <AddQuizForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {activeTab === 'edit' && selectedQuizId && (
        <ComponentCard title="Modifier le Quiz">
          <EditQuizForm
            quizId={selectedQuizId}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        </ComponentCard>
      )}

      {activeTab === 'view' && selectedQuizId && (
        <ComponentCard title="Détails du Quiz">
          <QuizDetails
            quizId={selectedQuizId}
            onEdit={handleEditClick}
            onAddQuestion={handleAddQuestionClick}
            onBack={handleBackToList}
          />
        </ComponentCard>
      )}

      {activeTab === 'add-question' && selectedQuizId && (
        <ComponentCard title="Ajouter une Question">
          <AddQuestionForm
            quizId={selectedQuizId}
            onSuccess={handleAddQuestionSuccess}
            onCancel={handleCancelAddQuestion}
          />
        </ComponentCard>
      )}
    </div>
  );
}
