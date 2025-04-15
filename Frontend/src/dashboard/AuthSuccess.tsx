import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  googleAuth?: boolean;
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
          // Google users are always verified
          if (decoded.role && decoded.role !== '') {
            // If user has a role, store it and redirect to appropriate dashboard
            localStorage.setItem("userRole", decoded.role);

            // Navigate to the appropriate dashboard based on user role
            console.log('AuthSuccess: User role from token:', decoded.role);
            const userRole = decoded.role;
            const userRoleLower = decoded.role.toLowerCase();

            if (userRole === 'admin' || userRoleLower === 'admin') {
              // Admin goes to the admin dashboard
              navigate("/dashboard");
            } else if (userRole === 'TeamLeader' || userRoleLower === 'teamleader') {
              // Team Leader goes to the team leader dashboard
              navigate("/team-leader-dashboard");
            } else if (userRole === 'member' || userRoleLower === 'member') {
              // Member goes to the member dashboard
              navigate("/member-dashboard");
            } else {
              // Default fallback
              console.log('No matching role found, defaulting to dashboard');
              navigate("/dashboard");
            }
          } else {
            // If no role, redirect to role selection
            navigate("/role-select");
          }
        } else {
          // Handle regular authentication flow
          if (decoded.isVerified) {
            if (decoded.role && decoded.role !== '') {
              localStorage.setItem("userRole", decoded.role);

              // Navigate to the appropriate dashboard based on user role
              console.log('AuthSuccess (regular flow): User role from token:', decoded.role);
              const userRole = decoded.role;
              const userRoleLower = decoded.role.toLowerCase();

              if (userRole === 'admin' || userRoleLower === 'admin') {
                // Admin goes to the admin dashboard
                navigate("/dashboard");
              } else if (userRole === 'TeamLeader' || userRoleLower === 'teamleader') {
                // Team Leader goes to the team leader dashboard
                navigate("/team-leader-dashboard");
              } else if (userRole === 'member' || userRoleLower === 'member') {
                // Member goes to the member dashboard
                navigate("/member-dashboard");
              } else {
                // Default fallback
                console.log('No matching role found, defaulting to dashboard');
                navigate("/dashboard");
              }
            } else {
              // If no role, redirect to role selection
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
