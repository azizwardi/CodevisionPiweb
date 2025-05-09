import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toastManager } from '../../components/ui/toast/ToastContainer';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';

interface Skill {
  _id: string;
  name: string;
  description: string;
  category: string;
}

interface RequiredSkill {
  _id: string;
  skill: Skill;
  minimumLevel: number;
}

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  requiredSkills: RequiredSkill[];
}

interface RequiredSkillsManagerProps {
  userId: string;
  readOnly?: boolean;
}

const RequiredSkillsManager: React.FC<RequiredSkillsManagerProps> = ({ userId, readOnly = false }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<RequiredSkill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [minimumLevel, setMinimumLevel] = useState<number>(1);
  const { isOpen, openModal, closeModal } = useModal();

  // Charger les compétences et les compétences requises de l'utilisateur
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('Fetching skills and required skills for user:', userId);

        // Récupérer toutes les compétences
        console.log('Fetching all skills...');
        const skillsResponse = await axios.get('http://localhost:5000/api/skills');
        console.log('Skills fetched successfully:', skillsResponse.data.length, 'skills found');
        setSkills(skillsResponse.data);

        // Récupérer les compétences requises de l'utilisateur
        console.log('Fetching required skills for user:', userId);
        const requiredSkillsUrl = `http://localhost:5000/api/skills/user/required/${userId}`;
        console.log('Request URL:', requiredSkillsUrl);

        try {
          const requiredSkillsResponse = await axios.get(requiredSkillsUrl);
          console.log('Required skills fetched successfully:', requiredSkillsResponse.data);
          setRequiredSkills(requiredSkillsResponse.data);
        } catch (reqErr: any) {
          console.error('Error fetching required skills:', reqErr);
          console.error('Error details:', reqErr.response?.status, reqErr.response?.data);
          // Si l'erreur est 404, on suppose que l'utilisateur n'a pas encore de compétences requises
          if (reqErr.response?.status === 404) {
            console.log('No required skills found for user, setting empty array');
            setRequiredSkills([]);
          } else {
            throw reqErr; // Relancer l'erreur pour qu'elle soit traitée par le catch externe
          }
        }
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Failed to load required skills data');
        toastManager.addToast('Error loading required skills data', 'error', 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Ajouter une compétence requise à l'utilisateur
  const handleAddRequiredSkill = async () => {
    if (!selectedSkill) {
      toastManager.addToast('Please select a skill', 'error', 5000);
      return;
    }

    try {
      console.log('Adding required skill for user:', userId);
      console.log('Skill data:', { userId, skillId: selectedSkill, minimumLevel });

      const url = 'http://localhost:5000/api/skills/user/required';
      console.log('Request URL:', url);

      const response = await axios.post(url, {
        userId,
        skillId: selectedSkill,
        minimumLevel
      });

      console.log('Required skill added successfully:', response.data);

      // Mettre à jour les compétences requises de l'utilisateur
      console.log('Fetching updated required skills...');
      const requiredSkillsUrl = `http://localhost:5000/api/skills/user/required/${userId}`;

      try {
        const requiredSkillsResponse = await axios.get(requiredSkillsUrl);
        console.log('Updated required skills fetched:', requiredSkillsResponse.data);
        setRequiredSkills(requiredSkillsResponse.data);
      } catch (reqErr: any) {
        console.error('Error fetching updated required skills:', reqErr);
        // Si l'erreur est 404, on suppose que l'utilisateur n'a pas encore de compétences requises
        if (reqErr.response?.status === 404) {
          console.log('No required skills found after adding, setting empty array');
          setRequiredSkills([]);
        } else {
          throw reqErr;
        }
      }

      toastManager.addToast('Required skill added successfully', 'success', 5000);
      closeModal();

      // Réinitialiser le formulaire
      setSelectedSkill('');
      setMinimumLevel(1);
    } catch (err: any) {
      console.error('Error adding required skill:', err);
      console.error('Error details:', err.response?.status, err.response?.data);
      toastManager.addToast(err.response?.data?.message || 'Error adding required skill', 'error', 5000);
    }
  };

  // Supprimer une compétence requise de l'utilisateur
  const handleRemoveRequiredSkill = async (skillId: string) => {
    if (!window.confirm('Are you sure you want to remove this required skill?')) {
      return;
    }

    try {
      console.log('Removing required skill for user:', userId, 'skill:', skillId);
      const deleteUrl = `http://localhost:5000/api/skills/user/required/${userId}/${skillId}`;
      console.log('Delete URL:', deleteUrl);

      const response = await axios.delete(deleteUrl);
      console.log('Delete response:', response.data);

      // Mettre à jour les compétences requises de l'utilisateur
      setRequiredSkills(requiredSkills.filter(skill => skill.skill._id !== skillId));

      toastManager.addToast('Required skill removed successfully', 'success', 5000);
    } catch (err: any) {
      console.error('Error removing required skill:', err);
      console.error('Error details:', err.response?.status, err.response?.data);
      toastManager.addToast(err.response?.data?.message || 'Error removing required skill', 'error', 5000);
    }
  };

  // Obtenir le nom de la catégorie
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'technical': 'Technical',
      'soft': 'Soft Skills',
      'domain': 'Domain Knowledge',
      'other': 'Other'
    };
    return categories[category] || category;
  };

  // Obtenir la couleur de la catégorie
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'technical': 'primary',
      'soft': 'success',
      'domain': 'warning',
      'other': 'gray'
    };
    return colors[category] || 'gray';
  };

  // Obtenir la couleur du niveau de compétence
  const getLevelColor = (level: number) => {
    const colors = ['gray', 'success', 'warning', 'error', 'primary'];
    return colors[level - 1] || 'gray';
  };

  // Obtenir le libellé du niveau de compétence
  const getLevelLabel = (level: number) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Unknown';
  };

  // Filtrer les compétences disponibles (non encore attribuées comme requises à l'utilisateur)
  const availableSkills = skills.filter(skill =>
    !requiredSkills || !requiredSkills.length ||
    !requiredSkills.some(requiredSkill => requiredSkill.skill && requiredSkill.skill._id === skill._id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Required Skills</h2>
        {!readOnly && (
          <Button
            size="sm"
            variant="primary"
            onClick={openModal}
            disabled={availableSkills.length === 0}
          >
            Add Required Skill
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">Loading required skills...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : !requiredSkills || requiredSkills.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">No required skills added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requiredSkills.map((requiredSkill) => (
            <div
              key={requiredSkill._id}
              className="flex flex-wrap justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">{requiredSkill.skill.name}</h3>
                  <Badge size="sm" color={getCategoryColor(requiredSkill.skill.category)}>
                    {getCategoryName(requiredSkill.skill.category)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{requiredSkill.skill.description}</p>
                <div className="flex gap-3 mt-2">
                  <Badge size="sm" color={getLevelColor(requiredSkill.minimumLevel)}>
                    Min. Level: {getLevelLabel(requiredSkill.minimumLevel)}
                  </Badge>
                </div>
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-error-500 hover:bg-error-50 hover:text-error-700"
                  onClick={() => handleRemoveRequiredSkill(requiredSkill.skill._id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal pour ajouter une compétence requise */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add Required Skill</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skill
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">Select a skill</option>
              {availableSkills.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name} ({getCategoryName(skill.category)})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Level Required
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={minimumLevel}
                onChange={(e) => setMinimumLevel(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                {getLevelLabel(minimumLevel)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleAddRequiredSkill}>
              Add Required Skill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequiredSkillsManager;
