import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import Button from "../../dashboard/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../dashboard/components/ui/table";

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

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

interface TeamTableProps {
  onEdit: (teamId: string) => void;
  onView: (teamId: string) => void;
  refreshTrigger: number;
}

export default function TeamTable({ onEdit, onView, refreshTrigger }: TeamTableProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token) as DecodedToken;
        const id = decoded.id || decoded.user?.id;
        console.log("Decoded token in TeamTable:", decoded);
        console.log("User ID from token in TeamTable:", id);

        if (id) {
          setUserId(id);
        } else {
          console.error("No user ID found in token");
          setError("Error authenticating user: User ID not found in token");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setError("Error authenticating user");
      }
    } else {
      console.error("No token found in localStorage");
      setError("Error authenticating user: No authentication token found");
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTeams();
    }
  }, [userId, refreshTrigger]);

  const fetchTeams = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`http://localhost:5000/teams/leader/${userId}`);
      setTeams(response.data);
    } catch (err: any) {
      console.error("Error fetching teams:", err);
      setError(err.message || "Failed to fetch teams");
      toastManager.addToast({
        title: "Error",
        description: "Failed to load teams",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/teams/${teamId}`);
      fetchTeams();
      toastManager.addToast({
        title: "Success",
        description: "Team deleted successfully",
        type: "success"
      });
    } catch (err: any) {
      console.error("Error deleting team:", err);
      toastManager.addToast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete team",
        type: "error"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading teams...</p>
        </div>
      ) : error ? (
        <div className="p-5 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">No teams found</p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    Team Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    Created
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    Members
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                      {team.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {team.description ? (
                        team.description.length > 50
                          ? `${team.description.substring(0, 50)}...`
                          : team.description
                      ) : (
                        "No description"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {formatDate(team.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {team.members.length}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onView(team._id)}
                        >
                          View Members
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(team._id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-error-500 hover:bg-error-50 hover:text-error-700"
                          onClick={() => handleDelete(team._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
