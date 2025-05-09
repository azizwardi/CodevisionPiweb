import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import AddProjectForm from "../../components/form/project/AddProjectForm";
import EditProjectForm from "../../components/form/project/EditProjectForm";
import ProjectTable from "../../components/tables/ProjectTable";
import Button from "../../components/ui/button/Button";

export default function FormElements() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Admin users can only view projects, not add or edit them
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

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
    // Admin users cannot edit projects
    if (isAdmin) {
      return;
    }
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
        title="Gestion des Projets | CodevisionPiweb"
        description="Page de gestion des projets pour CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Gestion des Projets" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Liste des Projets
        </Button>
        {!isAdmin && (
          <Button
            variant={activeTab === 'add' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('add')}
          >
            Ajouter un Projet
          </Button>
        )}
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Liste des Projets">
          <ProjectTable
            onEdit={handleEditClick}
            refreshTrigger={refreshTrigger}
            isAdmin={isAdmin}
          />
        </ComponentCard>
      )}

      {!isAdmin && activeTab === 'add' && (
        <ComponentCard title="Ajouter un Nouveau Projet">
          <AddProjectForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {!isAdmin && activeTab === 'edit' && selectedProjectId && (
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
