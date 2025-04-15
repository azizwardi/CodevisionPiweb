import { useState } from "react";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import ComponentCard from "../../dashboard/components/common/ComponentCard";
import AddProjectForm from "../../dashboard/components/form/project/AddProjectForm";
import EditProjectForm from "../../dashboard/components/form/project/EditProjectForm";
import ProjectTable from "../../dashboard/components/tables/ProjectTable";
import Button from "../../dashboard/components/ui/button/Button";

export default function TeamLeaderProjectManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

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
        title="Project Management"
        description="Manage your projects"
      />
      <PageBreadcrumb pageTitle="Project Management" />

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-3 mb-6 mt-4">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Project List
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Add Project
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' && (
        <ComponentCard title="Project List">
          <ProjectTable
            onEdit={handleEditClick}
            refreshTrigger={refreshTrigger}
          />
        </ComponentCard>
      )}

      {activeTab === 'add' && (
        <ComponentCard title="Add New Project">
          <AddProjectForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {activeTab === 'edit' && selectedProjectId && (
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
