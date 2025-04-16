import { useState } from "react";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import ComponentCard from "../../dashboard/components/common/ComponentCard";
import AddProjectForm from "../../dashboard/components/form/project/AddProjectForm";
import EditProjectForm from "../../dashboard/components/form/project/EditProjectForm";
import ProjectTable from "../../dashboard/components/tables/ProjectTable";
import Button from "../../dashboard/components/ui/button/Button";

export default function TeamLeaderProjects() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleAddSuccess = () => {
    setActiveTab('list');
    // Déclencher un rafraîchissement de la liste des projets
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setActiveTab('list');
    // Déclencher un rafraîchissement de la liste des projets
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('edit');
  };

  const handleCancelEdit = () => {
    setActiveTab('list');
    setSelectedProjectId("");
  };

  return (
    <div>
      <PageMeta
        title="Projects"
        description="Manage your projects"
      />
      <PageBreadcrumb pageTitle="Projects" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6 mt-4">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Liste des Projets
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Ajouter un Projet
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Liste des Projets">
          <ProjectTable
            onEdit={handleEditClick}
            refreshTrigger={refreshTrigger}
          />
        </ComponentCard>
      )}

      {activeTab === 'add' && (
        <ComponentCard title="Ajouter un Nouveau Projet">
          <AddProjectForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {activeTab === 'edit' && selectedProjectId && (
        <ComponentCard title="Modifier le Projet">
          <EditProjectForm
            projectId={selectedProjectId}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        </ComponentCard>
      )}
    </div>
  );
}