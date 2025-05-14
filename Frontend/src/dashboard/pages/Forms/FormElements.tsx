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
    // Trigger a refresh of the project list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setActiveTab('list');
    // Trigger a refresh of the project list
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
        title="Project Management | CodevisionPiweb"
        description="Project management page for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Project Management" />

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Project List
        </Button>
        {!isAdmin && (
          <Button
            variant={activeTab === 'add' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('add')}
          >
            Add Project
          </Button>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' && (
        <ComponentCard title="Project List">
          <ProjectTable
            onEdit={handleEditClick}
            refreshTrigger={refreshTrigger}
            isAdmin={isAdmin}
          />
        </ComponentCard>
      )}

      {!isAdmin && activeTab === 'add' && (
        <ComponentCard title="Add New Project">
          <AddProjectForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {!isAdmin && activeTab === 'edit' && selectedProjectId && (
        <ComponentCard title="Edit Project">
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
