import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toastManager } from '../../components/ui/toast/ToastContainer';
import Button from '../../components/ui/button/Button';
import { useNavigate } from 'react-router-dom';

// L'interface Skill a été supprimée car nous n'utilisons plus les compétences requises dans les tâches

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
}

interface AutoAssignTaskFormProps {
  onSuccess?: () => void;
}

const AutoAssignTaskForm: React.FC<AutoAssignTaskFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    dueDate: '',
    priority: 'medium',
    estimatedHours: 8,
    complexity: 5,
    taskType: 'development'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Charger les projets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Récupérer les projets
        const projectsResponse = await axios.get('http://localhost:5000/projects');

        // Vérifier le rôle de l'utilisateur
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');

        // Si c'est un TeamLeader, filtrer les projets dont il est créateur
        if (userRole === 'TeamLeader' && userId) {
          const filteredProjects = projectsResponse.data.filter(
            (project: any) => project.creator === userId
          );
          setProjects(filteredProjects);
        } else {
          // Pour les autres rôles (admin), afficher tous les projets
          setProjects(projectsResponse.data);
        }
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError(err.message || 'Failed to load projects');
        toastManager.addToast('Error loading projects', 'error', 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Les fonctions liées aux compétences requises ont été supprimées car nous n'utilisons plus les compétences requises dans les tâches

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation de base
    if (!formData.title || !formData.projectId) {
      toastManager.addToast('Title and project are required', 'error', 5000);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/tasks', {
        ...formData,
        autoAssign: true // Activer l'assignation automatique
      });

      toastManager.addToast('Task created and auto-assigned successfully', 'success', 5000);

      // Afficher les détails de l'assignation
      const { assignedMember, score } = response.data;
      if (assignedMember) {
        toastManager.addToast(
          `Task assigned to ${assignedMember.firstName || ''} ${assignedMember.lastName || assignedMember.username} (Match score: ${Math.round(score)}%)`,
          'info',
          8000
        );
      }

      // Réinitialiser le formulaire ou rediriger
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger en fonction du rôle de l'utilisateur
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'TeamLeader') {
          navigate('/team-leader/tasks');
        } else {
          navigate('/tasks');
        }
      }
    } catch (err: any) {
      console.error('Error creating task:', err);

      // Extraire le message d'erreur détaillé
      let errorMessage = 'Error creating task';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Afficher des conseils spécifiques en fonction du message d'erreur
      let errorDetails = '';

      if (errorMessage.includes("Projet non trouvé")) {
        errorDetails = "Le projet sélectionné n'existe pas ou a été supprimé. Veuillez sélectionner un autre projet.";
      } else if (errorMessage.includes("n'a pas de membres assignés")) {
        errorDetails = "Vous devez d'abord ajouter des membres à ce projet avant de pouvoir utiliser l'assignation automatique.";
      } else if (errorMessage.includes("Aucun membre disponible")) {
        errorDetails = "Aucun membre disponible n'a été trouvé dans ce projet. Assurez-vous que les membres ont les compétences requises.";
      }

      // Définir le message d'erreur complet
      const fullErrorMessage = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;

      setError(fullErrorMessage);
      toastManager.addToast(errorMessage, 'error', 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading data...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Create Task with AI Assignment</h2>

      {error && (
        <div className="mb-4 p-4 bg-error-50 text-error-700 rounded-md">
          <h3 className="font-semibold mb-2">Erreur lors de l'assignation automatique</h3>
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Titre de la tâche */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title*
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Projet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project*
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Type de tâche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Type
            </label>
            <select
              name="taskType"
              value={formData.taskType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="testing">Testing</option>
              <option value="DEVOPS">DEVOPS</option>
              <option value="JS">JS</option>
              <option value="JAVA">JAVA</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Heures estimées */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Complexité */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Complexity: {formData.complexity} / 10
            </label>
            <input
              type="range"
              name="complexity"
              value={formData.complexity}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full"
            />
          </div>

          {/* Note explicative sur l'assignation automatique */}
          <div className="md:col-span-2">
            <div className="p-4 bg-info-50 text-info-700 rounded-md">
              <h3 className="font-semibold mb-2">À propos de l'assignation automatique</h3>
              <p className="text-sm">
                L'IA assignera cette tâche au membre le plus approprié en fonction de sa disponibilité,
                de sa charge de travail actuelle, de ses compétences et de son expérience.
                Les compétences requises sont maintenant définies directement sur le profil des membres.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              const userRole = localStorage.getItem('userRole');
              if (userRole === 'TeamLeader') {
                navigate('/team-leader/tasks');
              } else {
                navigate('/tasks');
              }
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create & Auto-Assign Task'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AutoAssignTaskForm;
