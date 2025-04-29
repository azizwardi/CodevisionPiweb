import { useState, useEffect } from "react";
import axios from "axios";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { toastManager } from "../ui/toast/ToastContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Member {
  user: User;
  role: string;
  addedAt: string;
}

interface AssignMembersModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AssignMembersModal({
  projectId,
  projectName,
  onClose,
  onMemberAdded,
}: AssignMembersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  // Récupérer les membres actuels du projet
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/projects/${projectId}/members`);
        setMembers(response.data);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des membres:", err);
        const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la récupération des membres du projet";
        setError(`Erreur: ${errorMessage}. Détails: ${JSON.stringify(err.response?.data || {})}`);
        toastManager.addToast(
          errorMessage,
          "error",
          5000
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [projectId]);

  // Rechercher des utilisateurs par email
  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      setError("");
      console.log("Recherche d'utilisateurs avec email:", searchEmail);
      const response = await axios.get(`http://localhost:5000/projects/users/all`, {
        params: { email: searchEmail }
      });
      console.log("Utilisateurs trouvés:", response.data);
      setUsers(response.data);

      if (response.data.length === 0) {
        toastManager.addToast(
          "Aucun utilisateur trouvé avec cet email",
          "info",
          5000
        );
      }
    } catch (err: any) {
      console.error("Erreur lors de la recherche d'utilisateurs:", err);
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la recherche d'utilisateurs";
      setError(`Erreur: ${errorMessage}. Détails: ${JSON.stringify(err.response?.data || {})}`);
      toastManager.addToast(
        errorMessage,
        "error",
        5000
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Ajouter un membre au projet
  const addMember = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/projects/${projectId}/members`, {
        userId,
        role: "member"
      });

      // Ajouter le nouveau membre à la liste
      setMembers([...members, response.data.member]);

      // Filtrer l'utilisateur ajouté de la liste des utilisateurs
      setUsers(users.filter(user => user._id !== userId));

      toastManager.addToast(
        "Membre ajouté avec succès",
        "success",
        5000
      );

      // Notifier le parent que le membre a été ajouté
      onMemberAdded();
    } catch (err: any) {
      console.error("Erreur lors de l'ajout d'un membre:", err);
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout d'un membre";
      setError(errorMessage);
      toastManager.addToast(
        errorMessage,
        "error",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un membre du projet
  const removeMember = async (userId: string) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/projects/${projectId}/members/${userId}`);

      // Supprimer le membre de la liste
      setMembers(members.filter(member => member.user._id !== userId));

      toastManager.addToast(
        "Membre supprimé avec succès",
        "success",
        5000
      );

      // Notifier le parent que le membre a été supprimé
      onMemberAdded();
    } catch (err: any) {
      console.error("Erreur lors de la suppression d'un membre:", err);
      setError("Erreur lors de la suppression d'un membre");
      toastManager.addToast(
        "Erreur lors de la suppression d'un membre",
        "error",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  // Formater le nom d'utilisateur
  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  // Vérifier si un utilisateur est déjà membre
  const isUserMember = (userId: string) => {
    return members.some(member => member.user._id === userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Assigner des membres au projet: {projectName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Section de recherche */}
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium">Rechercher des utilisateurs</h3>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Rechercher par email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={searchUsers}
              disabled={searchLoading}
            >
              {searchLoading ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </div>

        {/* Liste des utilisateurs trouvés */}
        {users.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium">Utilisateurs trouvés</h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-theme-sm">
                        Nom
                      </TableCell>
                      <TableCell isHeader className="px-4 py-4 text-theme-sm">
                        Email
                      </TableCell>
                      <TableCell isHeader className="px-4 py-4 text-theme-sm">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                          {formatUserName(user)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addMember(user._id)}
                            disabled={loading || isUserMember(user._id)}
                          >
                            {isUserMember(user._id) ? "Déjà membre" : "Ajouter"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Liste des membres actuels */}
        <div>
          <h3 className="mb-2 text-lg font-medium">Membres actuels</h3>
          {loading ? (
            <p className="text-center text-gray-500">Chargement des membres...</p>
          ) : members.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-4 text-theme-sm">
                        Nom
                      </TableCell>
                      <TableCell isHeader className="px-4 py-4 text-theme-sm">
                        Email
                      </TableCell>
                      <TableCell isHeader className="px-4 py-4 text-theme-sm">
                        Rôle
                      </TableCell>
                      <TableCell isHeader className="px-4 py-4 text-theme-sm">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {members.map((member) => (
                      <TableRow key={member.user._id}>
                        <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                          {formatUserName(member.user)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {member.user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {member.role === "admin" ? "Administrateur" : "Membre"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => removeMember(member.user._id)}
                            disabled={loading}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Aucun membre dans ce projet</p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-500 dark:bg-red-900/20">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
