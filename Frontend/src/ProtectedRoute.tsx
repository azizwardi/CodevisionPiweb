import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Function to check if the user is authenticated and has the required role
const isAuthenticated = (requiredRole?: string): boolean => {
  const token = localStorage.getItem("authToken");
  const userRole = localStorage.getItem("userRole");

  if (!token) {
    console.log("No token found in localStorage.");
    return false;
  }

  console.log("Token found in localStorage:", token);
  console.log("User role in localStorage:", userRole);

  // If no role is required, just check authentication
  if (!requiredRole) return true;

  // Check if the user has the required role (case-insensitive)
  console.log('ProtectedRoute checking role:', userRole, 'required:', requiredRole);

  // Normalize roles for comparison (convert "Member" to "member", etc.)
  const normalizedUserRole = userRole?.toLowerCase();
  const normalizedRequiredRole = requiredRole?.toLowerCase();

  // Special case for "Member" role - accept both "member" and "Member"
  if ((normalizedRequiredRole === 'member' || requiredRole === 'Member') &&
      (normalizedUserRole === 'member' || userRole === 'Member')) {
    console.log(`User has required member role`);
    return true;
  }

  // General case for other roles
  if (normalizedUserRole === normalizedRequiredRole || userRole === requiredRole) {
    console.log(`User has required role: ${requiredRole}`);
    return true;
  } else {
    console.warn(`Access denied. Required role: ${requiredRole}, but found: ${userRole}`);
    return false;
  }
};

// Role-based protected route component
const ProtectedRoute: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  return isAuthenticated(requiredRole) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
