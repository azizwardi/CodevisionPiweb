import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/ui/spinner';
import { ArrowUpIcon, ArrowDownIcon } from '../../../components/ui/icons';
import { Badge } from '../../../components/ui/badge';
import { UserCircleIcon, ListIcon, TaskIcon } from '../../../components/ui/icons';
import TeamMembersPerformanceChart from "../../components/charts/TeamMembersPerformanceChart";
import TaskStatusChart from "../../components/charts/TaskStatusChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import TeamSkillsChart from "../../components/charts/TeamSkillsChart";
import toastManager from '../../../utils/toastManager';

// Types pour les statistiques
interface TeamLeaderDashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  team: {
    total: number;
  };
}

// Type pour les membres de l'équipe
interface TeamMember {
  name: string;
  tasksCompleted: number;
  tasksTotal: number;
  performancePercentage: number;
}

// Type pour les compétences
interface Skill {
  name: string;
  level: number;
}

// Composant pour afficher une métrique
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: number;
  loading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, change, loading }) => {
  return (
    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        {icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <Spinner size="sm" /> : value}
          </h4>
        </div>
        {change !== undefined && (
          <Badge color={change >= 0 ? "success" : "error"}>
            {change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(change)}%
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function TeamLeaderDashboard() {
  const [stats, setStats] = useState<TeamLeaderDashboardStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamSkills, setTeamSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);
        console.log('Récupération des statistiques du dashboard team leader...');

        // Récupérer les statistiques du dashboard
        const response = await axios.get(`http://localhost:5000/dashboard/team-leader/${user._id}`);
        console.log('Réponse du backend:', response.data);
        setStats(response.data);

        // Simuler des données pour les membres de l'équipe (à remplacer par une vraie API)
        const mockTeamMembers: TeamMember[] = [
          { name: 'John Doe', tasksCompleted: 18, tasksTotal: 25, performancePercentage: 72 },
          { name: 'Jane Smith', tasksCompleted: 12, tasksTotal: 20, performancePercentage: 60 },
          { name: 'Robert Johnson', tasksCompleted: 15, tasksTotal: 18, performancePercentage: 83 },
          { name: 'Emily Davis', tasksCompleted: 8, tasksTotal: 15, performancePercentage: 53 },
        ];
        setTeamMembers(mockTeamMembers);

        // Simuler des données pour les compétences de l'équipe (à remplacer par une vraie API)
        const mockTeamSkills: Skill[] = [
          { name: 'React', level: 85 },
          { name: 'Node.js', level: 75 },
          { name: 'TypeScript', level: 70 },
          { name: 'MongoDB', level: 65 },
          { name: 'Express', level: 80 },
        ];
        setTeamSkills(mockTeamSkills);

        setLoading(false);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des statistiques:', err);
        setError(err.message || 'Une erreur est survenue lors de la récupération des statistiques');
        toastManager.addToast({
          title: "Erreur",
          description: "Impossible de charger les statistiques du dashboard",
          type: "error"
        });
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  return (
    <div>
      <PageMeta
        title="Team Leader Dashboard | CodevisionPiweb"
        description="Team Leader Dashboard for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Team Leader Dashboard" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {/* Métriques principales */}
        <MetricCard
          title="Membres d'équipe"
          value={stats?.team?.total || 0}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
          loading={loading}
        />
        <MetricCard
          title="Projets"
          value={stats?.projects?.total || 0}
          icon={<ListIcon className="text-gray-800 size-6 dark:text-white/90" />}
          loading={loading}
        />
        <MetricCard
          title="Tâches"
          value={stats?.tasks?.total || 0}
          icon={<TaskIcon className="text-gray-800 size-6 dark:text-white/90" />}
          loading={loading}
        />
        <MetricCard
          title="Tâches complétées"
          value={stats?.tasks?.completed || 0}
          icon={<TaskIcon className="text-gray-800 size-6 dark:text-white/90" />}
          change={stats?.tasks?.total ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0}
          loading={loading}
        />
      </div>

      {/* Graphiques statistiques */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* Performance des membres de l'équipe */}
        <div className="col-span-12 xl:col-span-8">
          <ComponentCard title="Performance des membres de l'équipe">
            <TeamMembersPerformanceChart
              teamMembers={teamMembers}
              loading={loading}
            />
            <div className="grid grid-cols-4 gap-2 mt-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{member.name}</span>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {loading ? <Spinner size="sm" /> : `${member.performancePercentage}%`}
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>

        {/* Statut des projets */}
        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="État des projets">
            <ProjectStatusChart
              active={stats?.projects?.active || 0}
              completed={stats?.projects?.completed || 0}
              loading={loading}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Actifs</span>
                <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.projects?.active || 0}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Terminés</span>
                <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.projects?.completed || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Statut des tâches */}
        <div className="col-span-12 xl:col-span-6">
          <ComponentCard title="État des tâches">
            <TaskStatusChart
              pending={stats?.tasks?.pending || 0}
              inProgress={stats?.tasks?.inProgress || 0}
              completed={stats?.tasks?.completed || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">En attente</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.pending || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">En cours</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.inProgress || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Terminées</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.completed || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Compétences de l'équipe */}
        <div className="col-span-12 xl:col-span-6">
          <ComponentCard title="Compétences de l'équipe">
            <TeamSkillsChart
              skills={teamSkills}
              loading={loading}
            />
          </ComponentCard>
        </div>

        {/* Annonces d'équipe */}
        <div className="col-span-12">
          <ComponentCard title="Annonces d'équipe">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full">
                    <img src="/images/user/owner.jpg" alt="User" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      Réunion d'équipe
                    </h5>
                    <p className="text-sm">Demain à 10:00</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Réunion hebdomadaire pour discuter de l'avancement des projets et des tâches à venir.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full">
                    <img src="/images/user/owner.jpg" alt="User" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      Date limite du projet
                    </h5>
                    <p className="text-sm">Vendredi, 15 juin</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  La date limite pour le projet principal approche. Assurez-vous que toutes les tâches sont terminées.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full">
                    <img src="/images/user/owner.jpg" alt="User" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      Formation
                    </h5>
                    <p className="text-sm">Lundi, 20 juin</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Session de formation sur les nouvelles technologies à utiliser dans les prochains projets.
                </p>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
