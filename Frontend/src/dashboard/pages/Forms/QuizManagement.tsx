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
    // If a quiz ID is provided, redirect to the add question form
    if (quizId) {
      setSelectedQuizId(quizId);
      setActiveTab('add-question');
    } else {
      // Otherwise, return to the quiz list
      setActiveTab('list');
    }
    // Trigger a refresh of the quiz list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setActiveTab('list');
    // Trigger a refresh of the quiz list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddQuestionSuccess = (addAnother: boolean = false) => {
    if (addAnother) {
      // Stay on the add question form to add another one
      // Just refresh the data
      setRefreshTrigger(prev => prev + 1);
    } else {
      // Return to the detailed quiz view after adding a question
      setActiveTab('view');
      // Trigger a data refresh
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
    // If we were viewing a quiz, return to the detailed view
    if (selectedQuizId) {
      setActiveTab('view');
    } else {
      setActiveTab('list');
    }
  };

  return (
    <div>
      <PageMeta
        title="Quiz Management | CodevisionPiweb"
        description="Quiz management page for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Quiz Management" />

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Quiz List
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Create Quiz
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' && (
        <ComponentCard title="Quiz List">
          <QuizTable
            onEdit={handleEditClick}
            onView={handleViewClick}
            onAddQuestion={handleAddQuestionClick}
            refreshTrigger={refreshTrigger}
          />
        </ComponentCard>
      )}

      {activeTab === 'add' && (
        <ComponentCard title="Create New Quiz">
          <AddQuizForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {activeTab === 'edit' && selectedQuizId && (
        <ComponentCard title="Edit Quiz">
          <EditQuizForm
            quizId={selectedQuizId}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        </ComponentCard>
      )}

      {activeTab === 'view' && selectedQuizId && (
        <ComponentCard title="Quiz Details">
          <QuizDetails
            quizId={selectedQuizId}
            onEdit={handleEditClick}
            onAddQuestion={handleAddQuestionClick}
            onBack={handleBackToList}
          />
        </ComponentCard>
      )}

      {activeTab === 'add-question' && selectedQuizId && (
        <ComponentCard title="Add Question">
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
