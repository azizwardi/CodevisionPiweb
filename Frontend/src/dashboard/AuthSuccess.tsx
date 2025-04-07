import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
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
        // Store token in localStorage
        localStorage.setItem("authToken", token);
        
        // Decode token to get user info (optional)
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.role) {
          localStorage.setItem("userRole", decoded.role);
        }
        
        // Redirect to dashboard
        navigate("/dashboard");
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