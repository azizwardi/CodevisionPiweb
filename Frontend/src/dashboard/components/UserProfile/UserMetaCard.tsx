import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function UserMetaCard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    interface User {
      _id?: string;
      name?: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      avatarUrl?: string;
      phoneNumber?: string;
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    }

    // Function to listen for changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('user') && e.newValue) {
        // Force a component update when social links are modified
        setUser(prev => prev ? {...prev} : null);
      }
    };

    // Function to listen for custom social links update event
    const handleSocialLinksUpdate = (e: CustomEvent<{facebook?: string, twitter?: string, linkedin?: string, instagram?: string}>) => {
      // Force a component update with new values
      console.log('Social links updated:', e.detail);
      setUser(prev => prev ? {
        ...prev,
        // Update social links if present in the event
        ...(e.detail.facebook && { facebook: e.detail.facebook }),
        ...(e.detail.twitter && { twitter: e.detail.twitter }),
        ...(e.detail.linkedin && { linkedin: e.detail.linkedin }),
        ...(e.detail.instagram && { instagram: e.detail.instagram })
      } : null);
    };

    // Function to listen for custom avatar update event
    const handleAvatarUpdate = (e: CustomEvent<{avatarUrl: string}>) => {
      console.log('Avatar updated:', e.detail);
      setUser(prev => prev ? {
        ...prev,
        avatarUrl: e.detail.avatarUrl
      } : null);
    };

    // Function to fetch user data by ID
    const fetchUserById = async (userId: string) => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(`http://localhost:5000/api/user/showByid/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userData = response.data;
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    // Fonction pour gérer le changement d'avatar
    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const token = localStorage.getItem("authToken");

      if (!token || !user?._id) {
        setError("Vous devez être connecté pour changer votre photo de profil");
        return;
      }

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append("avatar", file);

      setLoading(true);
      setError("");

      try {
        const response = await axios.post(
          `http://localhost:5000/api/user/upload-avatar/${user._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );

        // Mettre à jour l'avatar dans le state
        setUser(prev => prev ? { ...prev, avatarUrl: response.data.avatarUrl } : null);

        // Déclencher un événement pour notifier les autres composants
        const event = new CustomEvent('avatarUpdated', {
          detail: { avatarUrl: response.data.avatarUrl }
        });
        window.dispatchEvent(event);

        // Mettre à jour le localStorage
        localStorage.setItem("userAvatarUrl", response.data.avatarUrl);
      } catch (err) {
        console.error("Erreur lors du changement d'avatar:", err);
        setError("Erreur lors du changement de la photo de profil");
      } finally {
        setLoading(false);
      }
    };

    // Effet pour le débogage de l'avatar
    useEffect(() => {
      if (user?.avatarUrl) {
        console.log('Avatar URL (from useEffect):', user.avatarUrl);
      }
    }, [user?.avatarUrl]);

    useEffect(() => {
      // Ajouter des écouteurs d'événement
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('socialLinksUpdated', handleSocialLinksUpdate as EventListener);
      window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);

      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          // Decode the token to extract user information
          interface DecodedToken {
            user?: {
              id: string;
              email: string;
              firstName?: string;
              lastName?: string;
              role?: string;
              phoneNumber?: string;
            };
            id?: string;
            email?: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            phoneNumber?: string;
          }

          const decodedToken = jwtDecode<DecodedToken>(token);

          // Handle the decoded token's structure
          const userData = decodedToken.user || decodedToken; // Fallback to top-level properties

          // Set the user state temporarily with token data
          setUser({
            _id: userData.id,
            email: userData.email || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            role: userData.role || "",
            avatarUrl: localStorage.getItem("userAvatarUrl") || "/images/user/owner.jpg",
            phoneNumber: userData.phoneNumber || "Not provided"
          });

          // Fetch complete user data if we have an ID
          if (userData.id) {
            fetchUserById(userData.id);
          }
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      } else {
        console.warn("No token found in local storage.");
      }

      // Nettoyer les écouteurs d'événement lors du démontage du composant
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('socialLinksUpdated', handleSocialLinksUpdate as EventListener);
        window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      };
    }, []);
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 group">
              <img
                src={user?.avatarUrl ?
                  (user.avatarUrl.startsWith('http') ? user.avatarUrl :
                   user.avatarUrl.startsWith('/') ? `http://localhost:5000${user.avatarUrl}` :
                   `http://localhost:5000/${user.avatarUrl}`) :
                  "/images/user/owner.jpg"}
                alt={user?.firstName || "user"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Erreur de chargement de l'image:", e);
                  // Fallback à l'image par défaut en cas d'erreur
                  e.currentTarget.src = "/images/user/owner.jpg";
                }}
              />
              {/* Le débogage est fait dans useEffect */}

              {/* Bouton pour changer la photo de profil */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>

              {/* Input file caché */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Indicateur de chargement et message d'erreur */}
            {loading && (
              <div className="absolute top-0 left-0 right-0 flex justify-center p-2 bg-gray-100 dark:bg-gray-800 text-sm">
                Chargement...
              </div>
            )}
            {error && (
              <div className="absolute top-0 left-0 right-0 flex justify-center p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user ? user.firstName : "Loading..."} {user ? user.lastName : ""}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                {user ? user.role : "Loading..."}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <a
                href={localStorage.getItem("userFacebook") || "https://www.facebook.com/PimjoHQ"}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"
                    fill=""
                  />
                </svg>
              </a>

              <a
                href={localStorage.getItem("userTwitter") || "https://x.com/PimjoHQ"}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z"
                    fill=""
                  />
                </svg>
              </a>

              <a
                href={localStorage.getItem("userLinkedin") || "https://www.linkedin.com/company/pimjo"}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z"
                    fill=""
                  />
                </svg>
              </a>

              <a
                href={localStorage.getItem("userInstagram") || "https://instagram.com/PimjoHQ"}
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463C18.3336 9.84055 18.3336 9.91888 18.3336 9.99972L18.3335 10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333C10.1594 18.333 10.0811 18.333 10.0002 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z"
                    fill=""
                  />
                </svg>
              </a>
            </div>
          </div>

        </div>
      </div>

    </>
  );
}
