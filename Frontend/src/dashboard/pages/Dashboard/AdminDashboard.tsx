import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ArrowUpIcon, ArrowDownIcon, UserCircleIcon, ListIcon, QuizIcon, TaskIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import { Spinner } from "../../components/ui/spinner/Spinner";
import { toastManager } from "../../components/ui/toast/ToastContainer";
import ComponentCard from "../../components/common/ComponentCard";

// Importer les composants de graphiques
import UserDistributionChart from "../../components/charts/UserDistributionChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import TaskStatusChart from "../../components/charts/TaskStatusChart";
import QuizActivityChart from "../../components/charts/QuizActivityChart";
import ActivityOverviewChart from "../../components/charts/ActivityOverviewChart";

// Types pour les statistiques
interface DashboardStats {
  users: {
    total: number;
    admins: number;
    teamLeaders: number;
    members: number;
  };
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
  quizzes: {
    total: number;
    published: number;
    attempts: number;
    completedAttempts: number;
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
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

// Composant pour afficher une section de statistiques
interface StatsSectionProps {
  title: string;
  stats: Record<string, number>;
  icon: React.ReactNode;
  loading: boolean;
}

const StatsSection: React.FC<StatsSectionProps> = ({ title, stats, icon, loading }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg mr-3 dark:bg-gray-800">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50">
            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {loading ? <Spinner size="sm" /> : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant principal du dashboard
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        console.log('Récupération des statistiques du dashboard admin...');

        // Utiliser l'URL complète du backend
        const response = await axios.get('http://localhost:5000/dashboard/admin');
        console.log('Réponse du backend:', response.data);
        const dashboardStats = response.data;

        setStats(dashboardStats);
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
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard Administrateur | CodevisionPiweb"
        description="Tableau de bord administrateur pour CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Dashboard Administrateur" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Métriques principales */}
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            <MetricCard
              title="Utilisateurs"
              value={stats?.users.total || 0}
              icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
              loading={loading}
            />
            <MetricCard
              title="Projets"
              value={stats?.projects.total || 0}
              icon={<ListIcon className="text-gray-800 size-6 dark:text-white/90" />}
              loading={loading}
            />
            <MetricCard
              title="Tâches"
              value={stats?.tasks.total || 0}
              icon={<TaskIcon className="text-gray-800 size-6 dark:text-white/90" />}
              loading={loading}
            />
            <MetricCard
              title="Quiz"
              value={stats?.quizzes.total || 0}
              icon={<QuizIcon className="text-gray-800 size-6 dark:text-white/90" />}
              loading={loading}
            />
          </div>

          {/* Graphique d'activité */}
          <ComponentCard title="Aperçu de l'activité">
            <ActivityOverviewChart loading={loading} />
          </ComponentCard>
        </div>

        {/* Statistiques détaillées */}
        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="Distribution des utilisateurs">
            <UserDistributionChart
              admins={stats?.users.admins || 0}
              teamLeaders={stats?.users.teamLeaders || 0}
              members={stats?.users.members || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Admins</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.users.admins || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Team Leaders</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.users.teamLeaders || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Membres</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.users.members || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="État des projets">
            <ProjectStatusChart
              active={stats?.projects.active || 0}
              completed={stats?.projects.completed || 0}
              loading={loading}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Actifs</span>
                <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.projects.active || 0}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Terminés</span>
                <div className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.projects.completed || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="État des tâches">
            <TaskStatusChart
              pending={stats?.tasks.pending || 0}
              inProgress={stats?.tasks.inProgress || 0}
              completed={stats?.tasks.completed || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">En attente</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks.pending || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">En cours</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks.inProgress || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Terminées</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks.completed || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="col-span-12">
          <ComponentCard title="Activité des quiz">
            <QuizActivityChart
              published={stats?.quizzes.published || 0}
              attempts={stats?.quizzes.attempts || 0}
              completed={stats?.quizzes.completedAttempts || 0}
              certificates={stats?.quizzes.certificates || 0}
              loading={loading}
            />
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Publiés</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes.published || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tentatives</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes.attempts || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Terminés</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes.completedAttempts || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Certificats</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes.certificates || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
