import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  googleAuth?: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  // Add other expected properties
}

export default function AuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      try {
        localStorage.setItem("authToken", token);
        const decoded = jwtDecode<JwtPayload>(token);

        // Handle Google authentication users
        if (decoded.googleAuth) {
          // Get role from either direct property or user object
          const userRole = decoded.role || (decoded.user && decoded.user.role) || '';
          console.log('AuthSuccess (Google): User role from token:', userRole);

          // Google users are always verified
          if (userRole && userRole !== '') {
            // If user has a role, store it and redirect to appropriate dashboard
            localStorage.setItem("userRole", userRole);

            // Navigate to the appropriate dashboard based on user role
            const userRoleLower = userRole.toLowerCase();

            if (userRole === 'admin' || userRoleLower === 'admin') {
              // Admin goes to the admin dashboard
              navigate("/dashboard");
            } else if (userRole === 'TeamLeader' || userRoleLower === 'teamleader') {
              // Team Leader goes to the team leader dashboard
              navigate("/team-leader-dashboard");
            } else if (userRole === 'Member' || userRoleLower === 'member') {
              // Member goes to the member dashboard
              navigate("/member-dashboard");
            } else {
              // Default fallback
              console.log('No matching role found, defaulting to dashboard');
              navigate("/dashboard");
            }
          } else {
            // If no role, redirect to role selection
            console.log('Google auth user has no role, redirecting to role selection');
            navigate("/role-select");
          }
        } else {
          // Handle regular authentication flow
          if (decoded.isVerified) {
            // Get role from either direct property or user object
            const userRole = decoded.role || (decoded.user && decoded.user.role) || '';
            console.log('AuthSuccess (regular flow): User role from token:', userRole);

            if (userRole && userRole !== '') {
              localStorage.setItem("userRole", userRole);

              // Navigate to the appropriate dashboard based on user role
              const userRoleLower = userRole.toLowerCase();

              if (userRole === 'admin' || userRoleLower === 'admin') {
                // Admin goes to the admin dashboard
                navigate("/dashboard");
              } else if (userRole === 'TeamLeader' || userRoleLower === 'teamleader') {
                // Team Leader goes to the team leader dashboard
                navigate("/team-leader-dashboard");
              } else if (userRole === 'Member' || userRoleLower === 'member') {
                // Member goes to the member dashboard
                navigate("/member-dashboard");
              } else {
                // Default fallback
                console.log('No matching role found, defaulting to dashboard');
                navigate("/dashboard");
              }
            } else {
              // If no role, redirect to role selection
              console.log('Regular auth user has no role, redirecting to role selection');
              navigate("/role-select");
            }
          } else {
            navigate("/verify-email");
          }
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        navigate("/signin?error=invalid_token");
      }
    } else {
      navigate("/signin?error=oauth_failed");
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Processing authentication...</h2>
        <p>You'll be redirected shortly</p>
      </div>
    </div>
  );
}
