import React, { useState } from 'react';
import axios from 'axios';
import { toastManager } from '../ui/toast/ToastContainer';
import Button from '../ui/button/Button';
import { Textarea } from '../ui/form/textarea';

interface TaskChatbotHelperProps {
  taskId: string;
  taskTitle: string;
}

const TaskChatbotHelper: React.FC<TaskChatbotHelperProps> = ({ taskId, taskTitle }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const getTaskHelp = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const result = await axios.post('http://localhost:5000/chatbot/task-help', {
        taskId,
        query
      });
      
      setResponse(result.data.response);
    } catch (err: any) {
      console.error("Erreur lors de la demande d'aide:", err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de la demande d'aide");
      toastManager.addToast("Erreur lors de la demande d'aide", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      getTaskHelp();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div 
        className="p-4 bg-blue-50 dark:bg-blue-900 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-semibold">AI Assistant for this task</h3>
        <span className="text-blue-500">
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      
      {expanded && (
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Ask the AI ​​assistant a question to get help with the task "{taskTitle}".
          </p>
          
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Comment puis-je résoudre ce problème ?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-2 border rounded-lg"
                rows={2}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="primary"
                  onClick={getTaskHelp}
                  disabled={loading || !query.trim()}
                >
                  {loading ? "Chargement..." : "Obtenir de l'aide"}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {response && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Assistant's response :</h4>
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{response}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskChatbotHelper;
