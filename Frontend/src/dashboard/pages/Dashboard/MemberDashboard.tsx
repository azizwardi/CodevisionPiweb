import React, { useState, useEffect } from 'react';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { Spinner } from '../../../components/ui/spinner';
import { ArrowUpIcon, ArrowDownIcon } from '../../../components/ui/icons';
import { Badge } from '../../../components/ui/badge';
import { UserCircleIcon, ListIcon, TaskIcon, AwardIcon } from '../../../components/ui/icons';
import TaskStatusChart from "../../components/charts/TaskStatusChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import QuizActivityChart from "../../components/charts/QuizActivityChart";
import toastManager from '../../../utils/toastManager';

// Types for statistics
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

// Component to display a metric
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

// Component to display a task
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
        return <p className="inline-flex rounded-full bg-danger bg-opacity-10 py-1 px-3 text-sm font-medium text-danger">Pending</p>;
      case 'in-progress':
        return <p className="inline-flex rounded-full bg-warning bg-opacity-10 py-1 px-3 text-sm font-medium text-warning">In Progress</p>;
      case 'completed':
        return <p className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">Completed</p>;
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
        <p className={getPriorityColor()}>{priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Low'}</p>
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
        console.log('Retrieving member dashboard statistics...');

        // Get dashboard statistics
        const response = await axios.get(`http://localhost:5000/dashboard/member/${user._id}`);
        console.log('Backend response:', response.data);
        setStats(response.data);

        setLoading(false);
      } catch (err: any) {
        console.error('Error retrieving statistics:', err);
        setError(err.message || 'An error occurred while retrieving statistics');
        toastManager.addToast({
          title: "Error",
          description: "Unable to load dashboard statistics",
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
        {/* Main metrics */}
        <MetricCard
          title="Projects"
          value={stats?.projects?.total || 0}
          icon={<ListIcon className="text-gray-800 size-6 dark:text-white/90" />}
          loading={loading}
        />
        <MetricCard
          title="Tasks"
          value={stats?.tasks?.total || 0}
          icon={<TaskIcon className="text-gray-800 size-6 dark:text-white/90" />}
          loading={loading}
        />
        <MetricCard
          title="Completed Tasks"
          value={stats?.tasks?.completed || 0}
          icon={<TaskIcon className="text-gray-800 size-6 dark:text-white/90" />}
          change={stats?.tasks?.total ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0}
          loading={loading}
        />
        <MetricCard
          title="Completed Quizzes"
          value={stats?.quizzes?.completed || 0}
          icon={<AwardIcon className="text-gray-800 size-6 dark:text-white/90" />}
          change={stats?.quizzes?.attempts ? Math.round((stats.quizzes.completed / stats.quizzes.attempts) * 100) : 0}
          loading={loading}
        />
      </div>

      {/* Statistical charts */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* Task status */}
        <div className="col-span-12 xl:col-span-6">
          <ComponentCard title="Task Status">
            <TaskStatusChart
              pending={stats?.tasks?.pending || 0}
              inProgress={stats?.tasks?.inProgress || 0}
              completed={stats?.tasks?.completed || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.pending || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.inProgress || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.tasks?.completed || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Quiz activity */}
        <div className="col-span-12 xl:col-span-6">
          <ComponentCard title="Quiz Activity">
            <QuizActivityChart
              published={0} // Not available for members
              attempts={stats?.quizzes?.attempts || 0}
              completed={stats?.quizzes?.completed || 0}
              certificates={stats?.quizzes?.certificates || 0}
              loading={loading}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Attempts</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.attempts || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.completed || 0}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-gray-800/50 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Certificates</span>
                <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {loading ? <Spinner size="sm" /> : stats?.quizzes?.certificates || 0}
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Task list */}
        <div className="col-span-12 xl:col-span-8">
          <ComponentCard title="My Tasks">
            <div className="flex flex-col">
              <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
                <div className="p-2.5 xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Task
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Due Date
                  </h5>
                </div>
                <div className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Priority
                  </h5>
                </div>
                <div className="hidden p-2.5 text-center sm:block xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">
                    Status
                  </h5>
                </div>
              </div>

              <TaskItem
                title="Create user interface mockups"
                dueDate="June 15, 2023"
                priority="high"
                status="in-progress"
              />

              <TaskItem
                title="Fix login page bug"
                dueDate="June 20, 2023"
                priority="medium"
                status="completed"
              />

              <TaskItem
                title="Optimize application performance"
                dueDate="June 25, 2023"
                priority="high"
                status="pending"
              />

              <TaskItem
                title="Update documentation"
                dueDate="June 30, 2023"
                priority="low"
                status="pending"
              />
            </div>
          </ComponentCard>
        </div>

        {/* Team announcements */}
        <div className="col-span-12 xl:col-span-4">
          <ComponentCard title="Team Announcements">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full">
                    <img src="/images/user/owner.jpg" alt="User" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      Team Meeting
                    </h5>
                    <p className="text-sm">Tomorrow at 10:00</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Weekly meeting to discuss project progress and upcoming tasks.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full">
                    <img src="/images/user/owner.jpg" alt="User" />
                  </div>
                  <div>
                    <h5 className="font-medium text-black dark:text-white">
                      Project Deadline
                    </h5>
                    <p className="text-sm">Friday, June 15</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The deadline for the main project is approaching. Make sure all tasks are completed.
                </p>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
