import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import ComponentCard from "../../dashboard/components/common/ComponentCard";
import Button from "../../dashboard/components/ui/button/Button";
import ProjectTable from "../../dashboard/components/tables/ProjectTable";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  teamMembers: User[];
  teamLeader: User;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: User;
  projectId: Project;
  dueDate: string;
  createdAt: string;
}

interface DecodedToken {
  id: string;
  user?: {
    id: string;
  };
}

const MemberProjects: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'details'>('list');
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const id = decoded.user?.id || decoded.id;
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setError("Authentication error");
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all projects
      const projectsResponse = await axios.get("http://localhost:5000/projects");

      // Fetch all tasks to determine which projects the user is involved in
      const tasksResponse = await axios.get("http://localhost:5000/tasks");
      setTasks(tasksResponse.data);

      // Get only projects where the user is explicitly assigned as a team member
      const userProjects = projectsResponse.data.filter((project: any) => {
        // Check if user is a team member (using members array from backend)
        const isTeamMember = project.members?.some((member: any) =>
          member.user._id === userId || member.user === userId
        );

        // Check if user is in teamMembers array (frontend structure)
        const isInTeamMembers = project.teamMembers?.some((member: any) =>
          member._id === userId
        );

        // Only return projects where the user is a team member
        return isTeamMember || isInTeamMembers;
      });

      setProjects(userProjects);
      setFilteredProjects(userProjects);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      toastManager.addToast("Error loading projects", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...projects];
    if (statusFilter) result = result.filter(project => project.status === statusFilter);
    setFilteredProjects(result);
  }, [projects, statusFilter]);

  const getTaskCountForProject = (projectId: string) => {
    return tasks.filter(task =>
      task.projectId?._id === projectId &&
      task.assignedTo?._id === userId
    ).length;
  };

  const getCompletedTaskCountForProject = (projectId: string) => {
    return tasks.filter(task =>
      task.projectId?._id === projectId &&
      task.assignedTo?._id === userId &&
      task.status === 'completed'
    ).length;
  };

  // Custom handler for viewing project details
  const handleViewProject = (projectId: string) => {
    navigate(`/member/projects/${projectId}`);
  };

  if (loading && !projects.length) return <div className="p-4">Loading projects...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading projects: {error}</div>;

  return (
    <div>
      <PageMeta
        title="My Projects"
        description="View and manage your assigned projects"
      />
      <PageBreadcrumb pageTitle="My Projects" />

      {/* Navigation entre les onglets */}
      <div className="flex flex-wrap gap-3 mb-6 mt-4">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Projects List
        </Button>
        <Button
          variant={activeTab === 'details' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('details')}
        >
          Projects Details
        </Button>
      </div>

      {/* Contenu en fonction de l'onglet actif */}
      {activeTab === 'list' && (
        <ComponentCard title="Projects List">
          <ProjectTable
            onEdit={() => {}} // Empty function as members can't edit projects
            refreshTrigger={refreshTrigger}
            isMember={true} // Custom prop to indicate this is for a member
          />
        </ComponentCard>
      )}

      {activeTab === 'details' && (
        <ComponentCard title="Projects details">
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block mb-1 text-sm font-medium">Filter by Status</label>
              <select
                className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No projects found. You are not assigned to any projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div key={project._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">My Progress</span>
                      <span className="text-sm font-medium text-gray-700">
                        {(() => {
                          const totalTasks = getTaskCountForProject(project._id);
                          if (totalTasks === 0) return "0%";
                          const completedTasks = getCompletedTaskCountForProject(project._id);
                          return Math.round((completedTasks / totalTasks) * 100) + "%";
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{
                          width: (() => {
                            const totalTasks = getTaskCountForProject(project._id);
                            if (totalTasks === 0) return "0%";
                            const completedTasks = getCompletedTaskCountForProject(project._id);
                            return Math.round((completedTasks / totalTasks) * 100) + "%";
                          })()
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <div>
                      <p>Start: {new Date(project.startDate).toLocaleDateString()}</p>
                      <p>End: {new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p>My Tasks: {getTaskCountForProject(project._id)}</p>
                      <p>Completed: {getCompletedTaskCountForProject(project._id)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/member/projects/${project._id}`)}
                    >
                      View tasks
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={project.teamLeader?.avatarUrl || "https://via.placeholder.com/40"}
                          alt={project.teamLeader?.username || "Team Leader"}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {project.teamLeader?.firstName && project.teamLeader?.lastName
                            ? `${project.teamLeader.firstName} ${project.teamLeader.lastName}`
                            : project.teamLeader?.username || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">Team Leader</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      )}
    </div>
  );
};

export default MemberProjects;
