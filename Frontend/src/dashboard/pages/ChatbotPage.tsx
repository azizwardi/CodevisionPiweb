import React from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import ChatbotInterface from '../components/chatbot/ChatbotInterface';

const ChatbotPage: React.FC = () => {
  return (
    <>
      <PageMeta title="Assistant IA" />
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Assistant IA', path: '/dashboard/assistant' },
        ]}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Assistant IA</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Posez vos questions à notre assistant IA pour obtenir de l'aide sur vos tâches et projets.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ChatbotInterface />
        </div>
      </div>
    </>
  );
};

export default ChatbotPage;
