// Configuration de l'API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default {
  baseURL: API_URL,
  endpoints: {
    users: `${API_URL}/api/user/showuser`,
    projects: `${API_URL}/projects`,
    events: `${API_URL}/events`,
    auth: `${API_URL}/api/auth`,
  },
};
