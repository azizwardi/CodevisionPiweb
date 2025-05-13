import React, { useState, useEffect } from "react";
import axios from "axios";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Button from "../../dashboard/components/ui/button/Button";
import AddMemberModal from "./AddMemberModal";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Skill {
  skill: string;
  level: number;
}

interface TeamMember {
  user: User;
  skills: Skill[];
  addedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  teamLeader: User;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface TeamDetailsProps {
  teamId: string;
  onBack: () => void;
  onEdit: (teamId: string) => void;
  refreshTrigger: number;
  onRefresh: () => void;
}

const TeamDetails: React.FC<TeamDetailsProps> = ({
  teamId,
  onBack,
  onEdit,
  refreshTrigger,
  onRefresh
}) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [teamId, refreshTrigger]);

  const fetchTeam = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`http://localhost:5000/teams/${teamId}`);
      setTeam(response.data);
    } catch (err: any) {
      console.error("Error fetching team:", err);
      setError(err.message || "Failed to fetch team details");
      toastManager.addToast({
        title: "Error",
        description: "Failed to load team details",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the team?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/teams/${teamId}/members/${memberId}`);
      fetchTeam();
      toastManager.addToast({
        title: "Success",
        description: "Member removed successfully",
        type: "success"
      });
    } catch (err: any) {
      console.error("Error removing member:", err);
      toastManager.addToast({
        title: "Error",
        description: err.response?.data?.message || "Failed to remove member",
        type: "error"
      });
    }
  };

  const handleAddMemberSuccess = () => {
    setShowAddMemberModal(false);
    fetchTeam();
    onRefresh();
    toastManager.addToast({
      title: "Success",
      description: "Member added successfully",
      type: "success"
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onBack}
        >
          Back to Teams
        </Button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Team not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onBack}
        >
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBack}
            >
              Back to Teams
            </Button>
            <Button
              variant="primary"
              onClick={() => onEdit(team._id)}
            >
              Edit Team
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {team.description || "No description provided."}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Created on: {formatDate(team.createdAt)}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <Button
            variant="primary"
            onClick={() => setShowAddMemberModal(true)}
          >
            Add Member
          </Button>
        </div>

        {team.members.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              This team doesn't have any members yet. Click the "Add Member" button to add team members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {team.members.map((member) => (
                  <tr key={member.user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                          <img
                            className="h-full w-full object-cover"
                            src={member.user.avatarUrl ?
                              (member.user.avatarUrl.startsWith('http') ? member.user.avatarUrl :
                               member.user.avatarUrl.startsWith('/') ? `http://localhost:5000${member.user.avatarUrl}` :
                               `http://localhost:5000/${member.user.avatarUrl}`) :
                              "/images/user/owner.jpg"}
                            alt={member.user.username}
                            onError={(e) => {
                              e.currentTarget.src = "/images/user/owner.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {member.user.firstName && member.user.lastName
                              ? `${member.user.firstName} ${member.user.lastName}`
                              : member.user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{member.user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{member.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {member.skills && member.skills.length > 0 ? (
                          member.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {skill.skill} (Level {skill.level})
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No skills added</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user._id)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          teamId={team._id}
          teamName={team.name}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={handleAddMemberSuccess}
        />
      )}
    </div>
  );
};

export default TeamDetails;
