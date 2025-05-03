import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toastManager } from "../../dashboard/components/ui/toast/ToastContainer";
import PageBreadcrumb from "../../dashboard/components/common/PageBreadCrumb";
import PageMeta from "../../dashboard/components/common/PageMeta";
import Label from "../../dashboard/components/form/Label";
import Input from "../../dashboard/components/form/input/InputField";
import TextArea from "../../dashboard/components/form/input/TextArea";
import Select from "../../dashboard/components/form/Select";
import Button from "../../dashboard/components/ui/button/Button";
import TaskChatbotHelper from "../../dashboard/components/chatbot/TaskChatbotHelper";

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Project {
  _id: string;
  name: string;
}

interface FormData {
  title: string;
  description: string;
  status: string;
  assignedTo: string;
  projectId: string;
  dueDate: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  projectId?: string;
  dueDate?: string;
}

const EditMemberTask: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    status: "pending",
    assignedTo: "",
    projectId: "",
    dueDate: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  useEffect(() => {
    const fetchTaskAndProjects = async () => {
      setFetchLoading(true);
      try {
        // Fetch task details
        const taskResponse = await axios.get(`http://localhost:5000/tasks/${taskId}`);
        const task = taskResponse.data;

        // Fetch projects for dropdown
        const projectsResponse = await axios.get("http://localhost:5000/projects");
        setProjects(projectsResponse.data);

        // Set form data
        setFormData({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "pending",
          assignedTo: task.assignedTo?._id || "",
          projectId: task.projectId?._id || "",
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
        });
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toastManager.addToast("Error loading task data", "error", 5000);
      } finally {
        setFetchLoading(false);
      }
    };

    if (taskId) {
      fetchTaskAndProjects();
    }
  }, [taskId]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when field is edited
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare task data for update
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        assignedTo: formData.assignedTo,
        projectId: formData.projectId,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
      };

      // Update the task
      await axios.put(`http://localhost:5000/tasks/${taskId}`, taskData);
      toastManager.addToast("Task updated successfully", "success", 5000);
      navigate("/member/tasks");
    } catch (err: any) {
      console.error("Error updating task:", err);
      setSubmitError(err.response?.data?.message || "Failed to update task");
      toastManager.addToast("Error updating task", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="p-6">Loading task data...</div>;
  }

  return (
    <div>
      <PageMeta title="Edit Task | Member Dashboard" description="Edit your task" />
      <PageBreadcrumb pageTitle="Edit Task" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {submitError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              error={!!validationErrors.title}
              hint={validationErrors.title}
            />
          </div>

          <div>
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={(value) => handleChange("description", value)}
              rows={4}
              error={!!validationErrors.description}
              hint={validationErrors.description}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                options={statusOptions}
                placeholder="Select status"
                onChange={(value) => handleChange("status", value)}
                value={formData.status}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                error={!!validationErrors.dueDate}
                hint={validationErrors.dueDate}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/member/tasks")}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>

        {/* Intégration de l'assistant IA pour cette tâche */}
        {taskId && !fetchLoading && (
          <div className="mt-8">
            <TaskChatbotHelper taskId={taskId} taskTitle={formData.title} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditMemberTask;
