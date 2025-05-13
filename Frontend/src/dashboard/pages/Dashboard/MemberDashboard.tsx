import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/ui/spinner';
import { ArrowUpIcon, ArrowDownIcon } from '../../../components/ui/icons';
import { Badge } from '../../../components/ui/badge';
import { UserCircleIcon, ListIcon, TaskIcon, ClockIcon } from '../../../components/ui/icons';
import TaskStatusChart from "../../components/charts/TaskStatusChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import QuizActivityChart from "../../components/charts/QuizActivityChart";
import toastManager from '../../../utils/toastManager';

// Types pour les statistiques
interface MemberDashboardStats {
  projects: {
    total: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  quizzes: {
    attempts: number;
    completed: number;
    certificates: number;
  };
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

// Composant pour afficher une tâche
interface TaskItemProps {
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

const TaskItem: React.FC<TaskItemProps> = ({ title, dueDate, priority, status }) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'text-meta-1';
      case 'medium': return 'text-meta-3';
      case 'low': return 'text-meta-5';
      default: return 'text-meta-5';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <p className="inline-flex rounded-full bg-danger bg-opacity-10 py-1 px-3 text-sm font-medium text-danger">En attente</p>;
      case 'in-progress':
        return <p className="inline-flex rounded-full bg-warning bg-opacity-10 py-1 px-3 text-sm font-medium text-warning">En cours</p>;
      case 'completed':
        return <p className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">Terminée</p>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-3 border-b border-stroke dark:border-strokedark sm:grid-cols-4">
      <div className="flex items-center gap-3 p-2.5 xl:p-5">
        <p className="text-black dark:text-white">{title}</p>
      </div>

      <div className="flex items-center justify-center p-2.5 xl:p-5">
        <p className="text-black dark:text-white">{dueDate}</p>
      </div>

      <div className="flex items-center justify-center p-2.5 xl:p-5">
        <p className={getPriorityColor()}>{priority === 'high' ? 'Élevée' : priority === 'medium' ? 'Moyenne' : 'Basse'}</p>
      </div>

      <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
        {getStatusBadge()}
      </div>
    </div>
  );
};

export default function MemberDashboard() {
  const [stats, setStats] = useState<MemberDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || !user._id) return;

      try {
        setLoading(true);
        console.log('Récupération des statistiques du dashboard member...');

        // Récupérer les statistiques du dashboard
        const response = await axios.get(`http://localhost:5000/dashboard/member/${user._id}`);
        console.log('Réponse du backend:', response.data);
        setStats(response.data);

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
        title="Member Dashboard | CodevisionPiweb"
        description="Member Dashboard for CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Member Dashboard" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {/* Métriques principales */}
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
        <MetricCard
          title="Quiz complétés"
          value={stats?.quizzes?.completed || 0}
          icon={<ClockIcon className="text-gray-800 size-6 dark:text-white/90" />}
          change={stats?.quizzes?.attempts ? Math.round((stats.quizzes.completed / stats.quizzes.attempts) * 100) : 0}
          loading={loading}
        />
      </div>

      {/* Graphiques statistiques */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
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

        {/* Activité des quiz */}
        <div className="col-span-12 xl:col-span-6">
          <ComponentCard title="Activité des quiz">
            <QuizActivityChart
              published={0} // Non disponible pour les membres
              attempts={stats?.quizzes?.attempts || 0}
              completed={stats?.quizzes?.completed || 0}
              certificates={stats?.quizzes?.certificates || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tentatives</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.attempts || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Complétés</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.completed || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Certificats</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.certificates || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Liste des tâches */}
        <div className="col-span-12 xl:col-span-8">
          <ComponentCard title="Mes tâches">
            <div className="flex flex-col">
              <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
                <div className="p-2.5 xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Tâche
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Date limite
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Priorité
                  </h5>
                </div>
                <div className="hidden p-2.5 text-center sm:block xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Statut
                  </h5>
                </div>
              </div>

              <TaskItem
                title="Créer des maquettes d'interface utilisateur"
                dueDate="15 juin 2023"
                priority="high"
                status="in-progress"
              />

              <TaskItem
                title="Corriger le bug de la page de connexion"
                dueDate="20 juin 2023"
                priority="medium"
                status="completed"
              />

              <TaskItem
                title="Optimiser les performances de l'application"
                dueDate="25 juin 2023"
                priority="high"
                status="pending"
              />

              <TaskItem
                title="Mettre à jour la documentation"
                dueDate="30 juin 2023"
                priority="low"
                status="pending"
              />
            </div>
          </ComponentCard>
        </div>

        {/* Annonces d'équipe */}
        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="Annonces d'équipe">
            <div className="space-y-4">
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
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
