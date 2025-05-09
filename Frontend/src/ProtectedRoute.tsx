import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Role-based protected route component
const ProtectedRoute: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Si l'authentification est en cours de chargement, afficher un écran de chargement
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié et que nous ne sommes pas en train de charger,
  // rediriger vers la page de connexion
  if (!isAuthenticated && !loading) {
    console.log("User is not authenticated, redirecting to signin");
    return <Navigate to="/signin" replace />;
  }

  // Si aucun rôle n'est requis, autoriser l'accès
  if (!requiredRole) {
    return <Outlet />;
  }

  // Vérifier si l'utilisateur a le rôle requis
  const userRole = user?.role;
  console.log('ProtectedRoute checking role:', userRole, 'required:', requiredRole);

  // Normaliser les rôles pour la comparaison
  const normalizedUserRole = userRole?.toLowerCase();
  const normalizedRequiredRole = requiredRole?.toLowerCase();

  // Cas spécial pour le rôle "Member"
  if ((normalizedRequiredRole === 'member' || requiredRole === 'Member') &&
      (normalizedUserRole === 'member' || userRole === 'Member')) {
    console.log(`User has required member role`);
    return <Outlet />;
  }

  // Special case for "admin" role - accept both "admin" and "Admin"
  if ((normalizedRequiredRole === 'admin' || requiredRole === 'Admin') &&
      (normalizedUserRole === 'admin' || userRole === 'Admin')) {
    console.log(`User has required admin role`);
    return <Outlet />;
  }

  // Special case for "TeamLeader" role - accept both "teamleader" and "TeamLeader"
  if ((normalizedRequiredRole === 'teamleader' || requiredRole === 'TeamLeader') &&
      (normalizedUserRole === 'teamleader' || userRole === 'TeamLeader')) {
    console.log(`User has required team leader role`);
    return <Outlet />;
  }

  // Cas général pour les autres rôles
  if (normalizedUserRole === normalizedRequiredRole || userRole === requiredRole) {
    console.log(`User has required role: ${requiredRole}`);
    return <Outlet />;
  } else {
    console.warn(`Access denied. Required role: ${requiredRole}, but found: ${userRole}`);
    return <Navigate to="/unauthorized" replace />;
  }
};

export default ProtectedRoute;
