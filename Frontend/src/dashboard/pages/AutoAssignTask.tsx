import React from 'react';
import AutoAssignTaskForm from '../components/tasks/AutoAssignTaskForm';

const AutoAssignTask: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Task Assignment</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a new task and let the AI assign it to the most suitable team member based on skills and availability.
        </p>
      </div>
      
      <AutoAssignTaskForm />
    </div>
  );
};

export default AutoAssignTask;
