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
  const [searchTerm, setSearchTerm] = useState("");
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

  // Vérifier si l'email est valide
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Rechercher des utilisateurs par terme de recherche (email, nom d'utilisateur, prénom, nom)
  const searchUsers = async () => {
    try {
      // Validation du terme de recherche
      if (!searchTerm || searchTerm.trim().length < 2) {
        setError("Veuillez entrer au moins 2 caractères pour la recherche");
        toastManager.addToast({
          title: "Validation",
          description: "Veuillez entrer au moins 2 caractères pour la recherche",
          type: "warning"
        });
        return;
      }

      setSearchLoading(true);
      setError("");
      console.log("Recherche d'utilisateurs avec le terme:", searchTerm);

      // Si le terme ressemble à un email, essayons d'abord de vérifier directement cet email
      if (isValidEmail(searchTerm)) {
        console.log("Le terme de recherche semble être un email, vérification directe...");
        try {
          // Vérifier d'abord si l'email existe et récupérer son rôle
          const checkResponse = await axios.get(`http://localhost:5000/api/user/check-email`, {
            params: { email: searchTerm }
          });

          console.log("Résultat de la vérification d'email:", checkResponse.data);

          if (checkResponse.data.exists) {
            // Si l'utilisateur existe, vérifier son rôle
            if (checkResponse.data.role === "Member") {
              // Si c'est un membre, récupérer ses détails complets
              const userResponse = await axios.get(`http://localhost:5000/api/user/showByid/${checkResponse.data.userId}`);
              console.log("Détails de l'utilisateur trouvé:", userResponse.data);

              // Créer un tableau avec cet utilisateur
              const foundUser = {
                _id: userResponse.data._id,
                username: userResponse.data.username,
                email: userResponse.data.email,
                firstName: userResponse.data.firstName,
                lastName: userResponse.data.lastName
              };

              setUsers([foundUser]);

              toastManager.addToast({
                title: "Succès",
                description: "Utilisateur trouvé avec cet email",
                type: "success"
              });

              setSearchLoading(false);
              return;
            } else {
              // Si l'utilisateur existe mais n'est pas un membre
              setError(`Ce mail n'est pas d'un member (rôle: ${checkResponse.data.role})`);
              toastManager.addToast({
                title: "Information",
                description: `Ce mail n'est pas d'un member (rôle: ${checkResponse.data.role})`,
                type: "warning"
              });
              setSearchLoading(false);
              return;
            }
          }
          // Si l'email n'existe pas, continuer avec la recherche normale
          console.log("Email non trouvé, poursuite avec la recherche standard...");
        } catch (emailCheckErr: any) {
          console.error("Erreur lors de la vérification de l'email:", emailCheckErr);

          // Afficher un message d'erreur spécifique pour aider au débogage
          const errorMessage = emailCheckErr.response?.data?.message || emailCheckErr.message || "Erreur lors de la vérification de l'email";
          console.warn(`Erreur de vérification d'email: ${errorMessage}. Tentative de recherche standard...`);

          // Afficher un toast d'information sans bloquer la recherche
          toastManager.addToast({
            title: "Information",
            description: "Vérification directe de l'email impossible, tentative de recherche standard...",
            type: "info"
          });

          // Continuer avec la recherche normale en cas d'erreur
        }
      }

      // Appel à l'API pour rechercher des utilisateurs
      const response = await axios.get(`http://localhost:5000/projects/users/all`, {
        params: { searchTerm }
      });

      console.log("Utilisateurs trouvés:", response.data);
      setUsers(response.data);

      if (response.data.length === 0) {
        toastManager.addToast({
          title: "Information",
          description: "Aucun utilisateur trouvé avec ce terme de recherche",
          type: "info"
        });
      } else {
        toastManager.addToast({
          title: "Succès",
          description: `${response.data.length} utilisateur(s) trouvé(s)`,
          type: "success"
        });
      }
    } catch (err: any) {
      console.error("Erreur lors de la recherche d'utilisateurs:", err);
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la recherche d'utilisateurs";
      setError(`Erreur: ${errorMessage}`);
      toastManager.addToast({
        title: "Erreur",
        description: errorMessage,
        type: "error"
      });
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

      toastManager.addToast({
        title: "Succès",
        description: "Membre ajouté avec succès",
        type: "success"
      });

      // Notifier le parent que le membre a été ajouté
      onMemberAdded();
    } catch (err: any) {
      console.error("Erreur lors de l'ajout d'un membre:", err);
      const errorMessage = err.response?.data?.message || "Erreur lors de l'ajout d'un membre";
      setError(errorMessage);
      toastManager.addToast({
        title: "Erreur",
        description: errorMessage,
        type: "error"
      });
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

      toastManager.addToast({
        title: "Succès",
        description: "Membre supprimé avec succès",
        type: "success"
      });

      // Notifier le parent que le membre a été supprimé
      onMemberAdded();
    } catch (err: any) {
      console.error("Erreur lors de la suppression d'un membre:", err);
      setError("Erreur lors de la suppression d'un membre");
      toastManager.addToast({
        title: "Erreur",
        description: "Erreur lors de la suppression d'un membre",
        type: "error"
      });
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
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Astuce :</span> Pour trouver rapidement un utilisateur, entrez son adresse email complète.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Entrez un email ou un nom d'utilisateur"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Effacer l'erreur si l'utilisateur commence à taper
                if (error) setError("");
              }}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchUsers();
                }
              }}
              error={!!error && (error.includes("recherche") || error.includes("mail"))}
              hint={error && (error.includes("recherche") || error.includes("mail")) ? error : ""}
            />
            <Button
              variant="primary"
              onClick={searchUsers}
              disabled={searchLoading || !searchTerm.trim() || searchTerm.trim().length < 2}
            >
              {searchLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recherche...
                </span>
              ) : "Rechercher"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Vous pouvez rechercher par adresse email complète (ex: user@example.com) ou par nom/prénom (minimum 2 caractères)
          </p>

          {isValidEmail(searchTerm) && (
            <div className="mt-2 text-xs text-green-600">
              ✓ Format d'email valide détecté - la recherche sera plus précise
            </div>
          )}
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

        {error && !error.includes("recherche") && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-red-500 dark:bg-red-900/20 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Erreur</p>
              <p>{error}</p>
            </div>
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
