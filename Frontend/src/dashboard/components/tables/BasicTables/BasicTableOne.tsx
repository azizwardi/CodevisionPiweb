import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useState, useEffect } from "react";
import axios from "axios";

// Interface pour les données utilisateur basée sur le modèle
interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  isVerified: boolean;
  address?: string;
  avatarUrl?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export default function BasicTableOne() {
  // État pour stocker les données utilisateur
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Effet pour déboguer les URLs des avatars
  useEffect(() => {
    if (users.length > 0) {
      console.log('Users with avatars:', users.map(user => ({
        username: user.username,
        avatarUrl: user.avatarUrl
      })));
    }
  }, [users]);

  // Effet pour récupérer les données utilisateur depuis l'API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get("http://localhost:5000/api/user/showuser", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {loading ? (
        <div className="p-5 text-center">
          <p className="text-gray-500 dark:text-gray-400">Chargement des utilisateurs...</p>
        </div>
      ) : error ? (
        <div className="p-5 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Nom d'utilisateur
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Nom complet
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Rôle
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Statut
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <img
                            width={40}
                            height={40}
                            src={user.avatarUrl ?
                              (user.avatarUrl.startsWith('http') ? user.avatarUrl :
                               user.avatarUrl.startsWith('/') ? `http://localhost:5000${user.avatarUrl}` :
                               `http://localhost:5000/${user.avatarUrl}`) :
                              "/images/user/owner.jpg"}
                            alt={user.username}
                            onError={(e) => {
                              // Fallback à l'image par défaut en cas d'erreur
                              e.currentTarget.src = "/images/user/owner.jpg";
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.username}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {user.phoneNumber || "Pas de téléphone"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : "Non renseigné"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={
                          user.role === "admin"
                            ? "success"
                            : user.role === "TeamLeader"
                            ? "warning"
                            : "info"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        color={user.isVerified ? "success" : "error"}
                      >
                        {user.isVerified ? "Vérifié" : "Non vérifié"}
                      </Badge>
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
