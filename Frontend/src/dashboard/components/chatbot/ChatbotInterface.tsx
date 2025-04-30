import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../ui/toast/ToastContainer';
import Button from '../ui/button/Button';
import { Textarea } from '../ui/form/textarea';

// Types
interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
}

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  conversation: string;
  createdAt: string;
  task?: {
    _id: string;
    title: string;
  };
}

interface Conversation {
  _id: string;
  title: string;
  user: User;
  project?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ChatbotInterfaceProps {
  projectId?: string;
  taskId?: string;
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ projectId, taskId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer l'ID de l'utilisateur depuis le token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        interface DecodedToken {
          user?: {
            id: string;
          };
          id?: string;
        }

        const decodedToken = jwtDecode<DecodedToken>(token);
        const id = decodedToken.user?.id || decodedToken.id;
        if (id) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        setError("Erreur d'authentification");
      }
    }
  }, []);

  // Récupérer les conversations de l'utilisateur
  useEffect(() => {
    if (userId) {
      fetchUserConversations();
    }
  }, [userId]);

  // Récupérer les messages de la conversation active
  useEffect(() => {
    if (activeConversation) {
      fetchConversationMessages();
    }
  }, [activeConversation]);

  // Faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/chatbot/conversations/user/${userId}`);
      setConversations(response.data);
      
      // Si aucune conversation active n'est sélectionnée et qu'il y a des conversations, sélectionner la première
      if (!activeConversation && response.data.length > 0) {
        setActiveConversation(response.data[0]._id);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error);
      setError("Erreur lors de la récupération des conversations");
      toastManager.addToast("Erreur lors de la récupération des conversations", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/chatbot/conversations/${activeConversation}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
      setError("Erreur lors de la récupération des messages");
      toastManager.addToast("Erreur lors de la récupération des messages", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/chatbot/conversations', {
        userId,
        projectId,
        title: projectId ? "Conversation sur le projet" : "Nouvelle conversation"
      });
      
      // Ajouter la nouvelle conversation à la liste et la définir comme active
      setConversations([response.data.conversation, ...conversations]);
      setActiveConversation(response.data.conversation._id);
      
      toastManager.addToast("Nouvelle conversation créée", "success", 3000);
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
      setError("Erreur lors de la création de la conversation");
      toastManager.addToast("Erreur lors de la création de la conversation", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!activeConversation) {
      // Si aucune conversation active, en créer une nouvelle
      await createNewConversation();
      if (!activeConversation) return; // Si la création a échoué, sortir
    }

    try {
      setLoading(true);
      
      // Ajouter temporairement le message de l'utilisateur à l'interface
      const tempUserMessage = {
        _id: `temp-${Date.now()}`,
        content: newMessage,
        role: 'user' as const,
        conversation: activeConversation,
        createdAt: new Date().toISOString()
      };
      
      setMessages([...messages, tempUserMessage]);
      setNewMessage('');
      
      // Envoyer le message au serveur
      const response = await axios.post('http://localhost:5000/chatbot/messages', {
        conversationId: activeConversation,
        content: tempUserMessage.content,
        taskId
      });
      
      // Mettre à jour les messages avec les réponses du serveur
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg._id !== tempUserMessage._id),
        response.data.userMessage,
        response.data.assistantMessage
      ]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setError("Erreur lors de l'envoi du message");
      toastManager.addToast("Erreur lors de l'envoi du message", "error", 5000);
      
      // Restaurer le message dans la zone de texte en cas d'erreur
      setNewMessage(messages.find(msg => msg._id === `temp-${Date.now()}`)?.content || newMessage);
      
      // Supprimer le message temporaire
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== `temp-${Date.now()}`));
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/chatbot/conversations/${conversationId}`);
      
      // Mettre à jour la liste des conversations
      setConversations(conversations.filter(conv => conv._id !== conversationId));
      
      // Si la conversation supprimée était active, sélectionner une autre conversation
      if (activeConversation === conversationId) {
        const remainingConversations = conversations.filter(conv => conv._id !== conversationId);
        setActiveConversation(remainingConversations.length > 0 ? remainingConversations[0]._id : null);
        setMessages([]);
      }
      
      toastManager.addToast("Conversation supprimée avec succès", "success", 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression de la conversation:", error);
      setError("Erreur lors de la suppression de la conversation");
      toastManager.addToast("Erreur lors de la suppression de la conversation", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar avec la liste des conversations */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Conversations</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={createNewConversation}
            disabled={loading}
          >
            Nouvelle
          </Button>
        </div>
        
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune conversation. Commencez par en créer une nouvelle.
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation._id}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${
                  activeConversation === conversation._id ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setActiveConversation(conversation._id)}
              >
                <div>
                  <h4 className="font-medium truncate">{conversation.title}</h4>
                  <p className="text-xs text-gray-500">{formatDate(conversation.updatedAt)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation._id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Zone principale de chat */}
      <div className="flex-1 flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">
            {activeConversation
              ? conversations.find(c => c._id === activeConversation)?.title || "Conversation"
              : "Sélectionnez ou créez une conversation"}
          </h3>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {!activeConversation ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Sélectionnez une conversation ou créez-en une nouvelle pour commencer à discuter.
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Aucun message. Commencez la conversation en envoyant un message.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {message.createdAt && formatDate(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Zone de saisie */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Tapez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 p-2 border rounded-lg resize-none"
              rows={2}
              disabled={loading || !activeConversation}
            />
            <Button
              variant="primary"
              onClick={sendMessage}
              disabled={loading || !newMessage.trim() || !activeConversation}
              className="self-end"
            >
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
