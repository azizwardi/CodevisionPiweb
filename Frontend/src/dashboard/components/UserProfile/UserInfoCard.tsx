import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  interface User {
    _id?: string;
    name?: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl?: string;
    phoneNumber?: string;
    username?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  }

  // Fonction pour récupérer les données utilisateur par ID
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
      setUser({
        _id: userData._id,
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        role: userData.role || "",
        avatarUrl: userData.avatarUrl || "/images/user/owner.jpg",
        phoneNumber: userData.phoneNumber || "Not provided",
        username: userData.username || "",
        facebook: userData.facebook || "",
        twitter: userData.twitter || "",
        linkedin: userData.linkedin || "",
        instagram: userData.instagram || ""
      });
      setFormData({
        _id: userData._id,
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        role: userData.role || "",
        avatarUrl: userData.avatarUrl || "/images/user/owner.jpg",
        phoneNumber: userData.phoneNumber || "",
        username: userData.username || "",
        facebook: userData.facebook || "",
        twitter: userData.twitter || "",
        linkedin: userData.linkedin || "",
        instagram: userData.instagram || ""
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        // Decode the token to extract user information
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decodedToken: any = jwtDecode(token); // Decode the JWT token

        // Handle the decoded token's structure
        const userData = decodedToken.user || decodedToken; // Fallback to top-level properties

        // Set the user state temporarily with token data
        setUser({
          _id: userData.id,
          email: userData.email,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "",
          avatarUrl: userData.avatarUrl || "/images/user/owner.jpg",
          phoneNumber: userData.phoneNumber || "Not provided",
          facebook: userData.facebook || "",
          twitter: userData.twitter || "",
          linkedin: userData.linkedin || "",
          instagram: userData.instagram || ""
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
  }, []);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!formData || !user?._id) {
      console.error("No form data or user ID available");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.put(
        `http://localhost:5000/api/user/update/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Mettre à jour l'état utilisateur avec les nouvelles données
      setUser(response.data);

      // Sauvegarder les liens sociaux et l'avatar dans localStorage pour les partager avec UserMetaCard
      if (formData.facebook) localStorage.setItem("userFacebook", formData.facebook);
      if (formData.twitter) localStorage.setItem("userTwitter", formData.twitter);
      if (formData.linkedin) localStorage.setItem("userLinkedin", formData.linkedin);
      if (formData.instagram) localStorage.setItem("userInstagram", formData.instagram);
      if (response.data.avatarUrl) localStorage.setItem("userAvatarUrl", response.data.avatarUrl);

      // Déclencher un événement personnalisé pour notifier UserMetaCard des liens sociaux
      const socialEvent = new CustomEvent('socialLinksUpdated', {
        detail: {
          facebook: formData.facebook,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          instagram: formData.instagram
        }
      });
      window.dispatchEvent(socialEvent);

      // Déclencher un événement personnalisé pour notifier UserMetaCard de l'avatar
      if (response.data.avatarUrl) {
        const avatarEvent = new CustomEvent('avatarUpdated', {
          detail: {
            avatarUrl: response.data.avatarUrl
          }
        });
        window.dispatchEvent(avatarEvent);
      }

      console.log("User updated successfully:", response.data);
      closeModal();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user information");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user ? user.firstName : "Loading..."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user ? user.lastName : "Loading..."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user ? user.email : "Loading..."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user ? user.phoneNumber : "Loading..."}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Bio
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user ? user.role : "Loading..."}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      type="text"
                      name="facebook"
                      value={formData?.facebook || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input
                      type="text"
                      name="twitter"
                      value={formData?.twitter || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input
                      type="text"
                      name="linkedin"
                      value={formData?.linkedin || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input
                      type="text"
                      name="instagram"
                      value={formData?.instagram || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData?.firstName || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData?.lastName || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      name="email"
                      value={formData?.email || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      name="phoneNumber"
                      value={formData?.phoneNumber || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Role</Label>
                    <Input
                      type="text"
                      name="role"
                      value={formData?.role || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
