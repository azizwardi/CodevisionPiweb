import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import ComponentCard from "../../dashboard/components/common/ComponentCard";
import Button from "../../dashboard/components/ui/button/Button";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import TeamTable from "../components/TeamTable";
import EditTeamForm from "../components/EditTeamForm";
import AddTeamForm from "../components/AddTeamForm";
import TeamDetails from "../components/TeamDetails";

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

const TeamLeaderTeam: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit' | 'view'>('list');
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        const id = decoded.id || decoded.user?.id;
        setUserId(id);
      } catch (error) {
        console.error("Error decoding token:", error);
        toastManager.addToast({
          title: "Error",
          description: "Error authenticating user",
          type: "error"
        });
      }
    }
  }, []);

  const handleAddSuccess = () => {
    setActiveTab('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setActiveTab('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setActiveTab('edit');
  };

  const handleViewClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setActiveTab('view');
  };

  const handleCancelEdit = () => {
    setActiveTab('list');
    setSelectedTeamId("");
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedTeamId("");
  };

  return (
    <div>
      <PageMeta
        title="My Team | CodevisionPiweb"
        description="Manage your team members"
      />
      <PageBreadcrumb pageTitle="My Team" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6 mt-4">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Liste des Équipes
        </Button>
        <Button
          variant={activeTab === 'add' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Créer une Équipe
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Liste des Équipes">
          <TeamTable
            onEdit={handleEditClick}
            onView={handleViewClick}
            refreshTrigger={refreshTrigger}
          />
        </ComponentCard>
      )}

      {activeTab === 'add' && (
        <ComponentCard title="Créer une Nouvelle Équipe">
          <AddTeamForm onSuccess={handleAddSuccess} />
        </ComponentCard>
      )}

      {activeTab === 'edit' && selectedTeamId && (
        <ComponentCard title="Modifier l'Équipe">
          <EditTeamForm
            teamId={selectedTeamId}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        </ComponentCard>
      )}

      {activeTab === 'view' && selectedTeamId && (
        <ComponentCard title="Détails de l'Équipe">
          <TeamDetails
            teamId={selectedTeamId}
            onBack={handleBackToList}
            onEdit={handleEditClick}
            refreshTrigger={refreshTrigger}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        </ComponentCard>
      )}
    </div>
  );
};

export default TeamLeaderTeam;
