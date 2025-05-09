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

interface UserSkill {
  _id: string;
  skill: Skill;
  proficiencyLevel: number;
  yearsOfExperience: number;
  addedAt: string;
}

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  skills: UserSkill[];
}

interface SkillsManagerProps {
  userId: string;
  readOnly?: boolean;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ userId, readOnly = false }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [proficiencyLevel, setProficiencyLevel] = useState<number>(3);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const { isOpen, openModal, closeModal } = useModal();

  // Charger les compétences et les compétences de l'utilisateur
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Récupérer toutes les compétences
        const skillsResponse = await axios.get('http://localhost:5000/api/skills');
        setSkills(skillsResponse.data);

        // Récupérer les compétences de l'utilisateur
        const userSkillsResponse = await axios.get(`http://localhost:5000/api/skills/user/${userId}`);
        setUserSkills(userSkillsResponse.data);
      } catch (err: any) {
        console.error('Error fetching skills data:', err);
        setError(err.message || 'Failed to load skills data');
        toastManager.addToast('Error loading skills data', 'error', 5000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Ajouter une compétence à l'utilisateur
  const handleAddSkill = async () => {
    if (!selectedSkill) {
      toastManager.addToast('Please select a skill', 'error', 5000);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/skills/user', {
        userId,
        skillId: selectedSkill,
        proficiencyLevel,
        yearsOfExperience
      });

      // Mettre à jour les compétences de l'utilisateur
      const userSkillsResponse = await axios.get(`http://localhost:5000/api/skills/user/${userId}`);
      setUserSkills(userSkillsResponse.data);

      toastManager.addToast('Skill added successfully', 'success', 5000);
      closeModal();

      // Réinitialiser le formulaire
      setSelectedSkill('');
      setProficiencyLevel(3);
      setYearsOfExperience(0);
    } catch (err: any) {
      console.error('Error adding skill:', err);
      toastManager.addToast(err.response?.data?.message || 'Error adding skill', 'error', 5000);
    }
  };

  // Supprimer une compétence de l'utilisateur
  const handleRemoveSkill = async (skillId: string) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/skills/user/${userId}/${skillId}`);

      // Mettre à jour les compétences de l'utilisateur
      setUserSkills(userSkills.filter(skill => skill.skill._id !== skillId));

      toastManager.addToast('Skill removed successfully', 'success', 5000);
    } catch (err: any) {
      console.error('Error removing skill:', err);
      toastManager.addToast(err.response?.data?.message || 'Error removing skill', 'error', 5000);
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
  const getProficiencyColor = (level: number) => {
    const colors = ['error', 'warning', 'warning', 'success', 'primary'];
    return colors[level - 1] || 'gray';
  };

  // Obtenir le libellé du niveau de compétence
  const getProficiencyLabel = (level: number) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Unknown';
  };

  // Filtrer les compétences disponibles (non encore attribuées à l'utilisateur)
  const availableSkills = skills.filter(skill =>
    !userSkills.some(userSkill => userSkill.skill._id === skill._id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Skills & Expertise</h2>
        {!readOnly && (
          <Button
            size="sm"
            variant="primary"
            onClick={openModal}
            disabled={availableSkills.length === 0}
          >
            Add Skill
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">Loading skills...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : userSkills.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">No skills added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userSkills.map((userSkill) => (
            <div
              key={userSkill._id}
              className="flex flex-wrap justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">{userSkill.skill.name}</h3>
                  <Badge size="sm" color={getCategoryColor(userSkill.skill.category)}>
                    {getCategoryName(userSkill.skill.category)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userSkill.skill.description}</p>
                <div className="flex gap-3 mt-2">
                  <Badge size="sm" color={getProficiencyColor(userSkill.proficiencyLevel)}>
                    {getProficiencyLabel(userSkill.proficiencyLevel)}
                  </Badge>
                  {userSkill.yearsOfExperience > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {userSkill.yearsOfExperience} {userSkill.yearsOfExperience === 1 ? 'year' : 'years'} of experience
                    </span>
                  )}
                </div>
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-error-500 hover:bg-error-50 hover:text-error-700"
                  onClick={() => handleRemoveSkill(userSkill.skill._id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal pour ajouter une compétence */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add Skill</h3>

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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proficiency Level
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                {getProficiencyLabel(proficiencyLevel)}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleAddSkill}>
              Add Skill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SkillsManager;
