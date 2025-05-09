import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";

interface ValidationErrors {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phoneNumber?: string;
  experienceLevel?: string;
}

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
  experienceLevel?: string;
}

interface EditUserFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({ userId, onSuccess, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    phoneNumber: "",
    experienceLevel: "",
  });

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const roleOptions = [
    { value: "admin", label: "Administrateur" },
    { value: "TeamLeader", label: "Chef d'équipe" },
    { value: "user", label: "Utilisateur" },
  ];

  const experienceLevelOptions = [
    { value: "intern", label: "Stagiaire" },
    { value: "junior", label: "Junior" },
    { value: "mid-level", label: "Intermédiaire" },
    { value: "senior", label: "Senior" },
    { value: "expert", label: "Expert" },
    { value: "lead", label: "Lead" },
  ];

  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("Chargement de l'utilisateur avec l'ID:", userId);
        setFetchLoading(true);

        // Pour le débogage, nous utilisons l'API showuser pour récupérer tous les utilisateurs
        // puis nous filtrons pour trouver celui qui correspond à l'ID
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Vous devez être connecté pour modifier un utilisateur");
        }

        const response = await axios.get(
          "http://localhost:5000/api/user/showuser",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Trouver l'utilisateur avec l'ID correspondant
        const users = response.data;
        const user = users.find((u: any) => u._id === userId);

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        console.log("Utilisateur trouvé:", user);

        setFormData({
          username: user.username || "",
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role || "",
          phoneNumber: user.phoneNumber || "",
          experienceLevel: user.experienceLevel || "mid-level",
        });

        // Définir l'URL de l'avatar
        if (user.avatarUrl) {
          const fullAvatarUrl = user.avatarUrl.startsWith('http')
            ? user.avatarUrl
            : user.avatarUrl.startsWith('/')
              ? `http://localhost:5000${user.avatarUrl}`
              : `http://localhost:5000/${user.avatarUrl}`;

          setAvatarUrl(fullAvatarUrl);
          setPreviewUrl(fullAvatarUrl);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement de l'utilisateur:", err);
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement de l'utilisateur");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));

    // Effacer l'erreur de validation pour le rôle
    if (validationErrors.role) {
      setValidationErrors(prev => ({
        ...prev,
        role: undefined
      }));
    }
  };

  const handleExperienceLevelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, experienceLevel: value }));

    // Effacer l'erreur de validation pour le niveau d'expérience
    if (validationErrors.experienceLevel) {
      setValidationErrors(prev => ({
        ...prev,
        experienceLevel: undefined
      }));
    }
  };

  // Fonction pour gérer la sélection d'un fichier image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        toastManager.addToast("Veuillez sélectionner une image", "error");
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastManager.addToast("L'image ne doit pas dépasser 5MB", "error");
        return;
      }

      console.log("Image sélectionnée:", file.name, "Type:", file.type, "Taille:", Math.round(file.size / 1024), "KB");

      setSelectedFile(file);

      // Créer une URL pour prévisualiser l'image
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          setPreviewUrl(fileReader.result as string);
          toastManager.addToast("Image sélectionnée. Cliquez sur 'Télécharger l'image' pour confirmer.", "info");
        }
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Fonction pour déclencher le clic sur l'input file
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fonction pour télécharger l'image
  const uploadAvatar = async () => {
    if (!selectedFile) {
      toastManager.addToast("Veuillez d'abord sélectionner une image", "warning");
      return;
    }

    try {
      setLoading(true);
      setSuccess("");
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Téléchargement de l'image en cours...");
      console.log("Fichier sélectionné:", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: `${Math.round(selectedFile.size / 1024)} KB`
      });

      // Vérifier à nouveau le type de fichier
      if (!selectedFile.type.match('image.*')) {
        throw new Error("Le fichier sélectionné n'est pas une image");
      }

      // Vérifier à nouveau la taille du fichier
      if (selectedFile.size > 5 * 1024 * 1024) {
        throw new Error("L'image ne doit pas dépasser 5MB");
      }

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      // Afficher le contenu du FormData pour le débogage
      console.log("FormData créé avec le fichier");

      // Afficher les en-têtes de la requête
      const headers = {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      };
      console.log("En-têtes de la requête:", headers);

      // Afficher l'URL de la requête
      const url = `http://localhost:5000/api/user/upload-avatar/${userId}`;
      console.log("URL de la requête:", url);

      const response = await axios.post(url, formData, { headers });

      console.log("Réponse du serveur:", response.data);

      if (response.data.avatarUrl) {
        // Ajouter un timestamp pour éviter la mise en cache
        const timestamp = new Date().getTime();
        const fullAvatarUrl = response.data.avatarUrl.startsWith('http')
          ? `${response.data.avatarUrl}?t=${timestamp}`
          : response.data.avatarUrl.startsWith('/')
            ? `http://localhost:5000${response.data.avatarUrl}?t=${timestamp}`
            : `http://localhost:5000/${response.data.avatarUrl}?t=${timestamp}`;

        console.log("Nouvelle URL d'avatar:", fullAvatarUrl);

        // Tester si l'image est accessible
        const testImg = new Image();
        testImg.onload = () => {
          console.log("L'image est accessible");
        };
        testImg.onerror = () => {
          console.warn("L'image n'est pas accessible, mais on continue quand même");
        };
        testImg.src = fullAvatarUrl;

        setAvatarUrl(fullAvatarUrl);
        setPreviewUrl(fullAvatarUrl);
        setSuccess("Image de profil mise à jour avec succès");
        toastManager.addToast("Image de profil mise à jour avec succès", "success");

        // Émettre un événement personnalisé pour notifier les autres composants
        const avatarUpdateEvent = new CustomEvent('avatar-updated', {
          detail: { avatarUrl: fullAvatarUrl, userId }
        });
        window.dispatchEvent(avatarUpdateEvent);

        // Réinitialiser le fichier sélectionné
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Forcer un rafraîchissement de l'interface
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("La réponse du serveur ne contient pas d'URL d'avatar");
      }
    } catch (err: any) {
      console.error("Erreur lors du téléchargement de l'image:", err);

      // Afficher des informations détaillées sur l'erreur
      if (err.response) {
        console.error("Détails de l'erreur:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      }

      setError(err.response?.data?.message || err.message || "Erreur lors du téléchargement de l'image");
      toastManager.addToast(
        err.response?.data?.message || err.message || "Erreur lors du téléchargement de l'image",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction de validation des champs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validation du nom d'utilisateur
    if (!formData.username.trim()) {
      errors.username = "Le nom d'utilisateur est requis";
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
      isValid = false;
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "L'email n'est pas valide";
      isValid = false;
    }

    // Validation du rôle
    if (!formData.role) {
      errors.role = "Veuillez sélectionner un rôle";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation des champs
    if (!validateForm()) {
      return; // Arrêter si la validation échoue
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Vous devez être connecté pour modifier un utilisateur");
      }

      // Pour le débogage, nous affichons les données que nous allons envoyer
      console.log("Envoi des données pour la modification de l'utilisateur:", {
        userId,
        formData
      });

      const response = await axios.put(
        `http://localhost:5000/api/user/update/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Réponse de la modification:", response.data);

      // Afficher un toast de succès
      toastManager.addToast("Utilisateur modifié avec succès", "success", 5000);

      // Notifier le parent du succès
      onSuccess();
    } catch (err: any) {
      console.error("Erreur lors de la modification de l'utilisateur:", err);
      const errorMessage = err.response?.data?.message || "Erreur lors de la modification de l'utilisateur";
      setError(errorMessage);
      toastManager.addToast(errorMessage, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="text-center p-4">Chargement de l'utilisateur...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 mb-4 text-sm text-white bg-error-500 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 mb-4 text-sm text-white bg-success-500 rounded-lg">
          {success}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Photo de profil
        </h2>

        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 relative">
            <img
              src={previewUrl || avatarUrl || "/images/user/owner.jpg"}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.src = "/images/user/owner.jpg";
              }}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              className="px-4 py-2"
            >
              Choisir une image
            </Button>

            {selectedFile && (
              <Button
                type="button"
                variant="primary"
                onClick={uploadAvatar}
                className="px-4 py-2"
                disabled={loading}
              >
                {loading ? "Téléchargement..." : "Télécharger l'image"}
              </Button>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG ou GIF. 5MB maximum.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Entrez le nom d'utilisateur"
            error={!!validationErrors.username}
            hint={validationErrors.username}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Entrez l'email"
            error={!!validationErrors.email}
            hint={validationErrors.email}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Entrez le prénom"
            error={!!validationErrors.firstName}
            hint={validationErrors.firstName}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Entrez le nom"
            error={!!validationErrors.lastName}
            hint={validationErrors.lastName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Rôle</Label>
          <div className="relative">
            <Select
              options={roleOptions}
              placeholder="Sélectionnez un rôle"
              onChange={handleRoleChange}
              value={formData.role}
              className={`dark:bg-dark-900 ${validationErrors.role ? 'border-error-500' : ''}`}
            />
            {validationErrors.role && (
              <p className="mt-1.5 text-xs text-error-500">
                {validationErrors.role}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="phoneNumber">Téléphone</Label>
          <Input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Entrez le numéro de téléphone"
            error={!!validationErrors.phoneNumber}
            hint={validationErrors.phoneNumber}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Niveau d'expérience</Label>
          <div className="relative">
            <Select
              options={experienceLevelOptions}
              placeholder="Sélectionnez un niveau d'expérience"
              onChange={handleExperienceLevelChange}
              value={formData.experienceLevel}
              className={`dark:bg-dark-900 ${validationErrors.experienceLevel ? 'border-error-500' : ''}`}
            />
            {validationErrors.experienceLevel && (
              <p className="mt-1.5 text-xs text-error-500">
                {validationErrors.experienceLevel}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Modification en cours..." : "Modifier l'utilisateur"}
        </Button>
      </div>
    </form>
  );
}
