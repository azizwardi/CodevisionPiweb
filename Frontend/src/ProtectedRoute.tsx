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

  // If no role is required, just check authentication
  if (!requiredRole) return true;

  // Check if the user has the required role
  if (userRole === requiredRole) {
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
