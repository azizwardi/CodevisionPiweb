import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toastManager } from '../ui/toast/ToastContainer';
import Button from '../ui/button/Button';
import { Textarea } from '../ui/form/textarea';
import TypingAnimation from '../../../components/TypingAnimation';

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
  const [typingMessage, setTypingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
        console.error("Error decoding token:", error);
        setError("Authentication error");
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
      // Scroll to bottom when a conversation is selected
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversation]);

  // Scroll down when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

  // Listen for typing progress to scroll during typing animation
  useEffect(() => {
    const handleTypingProgress = () => scrollToBottom();
    window.addEventListener('typingProgress', handleTypingProgress);

    return () => {
      window.removeEventListener('typingProgress', handleTypingProgress);
    };
  }, []);

  // Use MutationObserver to detect changes in the message container
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    // Create a MutationObserver to watch for changes in the message container
    const observer = new MutationObserver((mutations) => {
      // If there are mutations, scroll to bottom
      if (mutations.length > 0) {
        scrollToBottom();
      }
    });

    // Start observing the message container for changes
    observer.observe(messagesContainerRef.current, {
      childList: true,      // Watch for changes to the direct children
      subtree: true,        // Watch for changes in all descendants
      characterData: true,  // Watch for changes in text content
      attributes: true      // Watch for changes in attributes
    });

    return () => {
      // Clean up the observer when the component unmounts
      observer.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame to ensure the scroll happens after DOM updates
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  // Handle typing message completion
  const handleTypingComplete = () => {
    if (typingMessage) {
      setMessages(prev => [...prev, typingMessage]);
      setTypingMessage(null);
    }
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
      console.error("Error retrieving conversations:", error);
      setError("Error retrieving conversations");
      toastManager.addToast("Error retrieving conversations", "error", 5000);
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
      console.error("Error retrieving messages:", error);
      setError("Error retrieving messages");
      toastManager.addToast("Error retrieving messages", "error", 5000);
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
        title: projectId ? "Project conversation" : "New conversation"
      });

      // Add the new conversation to the list and set it as active
      setConversations([response.data.conversation, ...conversations]);
      setActiveConversation(response.data.conversation._id);

      toastManager.addToast("New conversation created", "success", 3000);
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("Error creating conversation");
      toastManager.addToast("Error creating conversation", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!activeConversation) {
      // If no active conversation, create a new one
      await createNewConversation();
      if (!activeConversation) return; // If creation failed, exit
    }

    try {
      setLoading(true);

      // Temporarily add the user message to the interface
      const tempUserMessage = {
        _id: `temp-${Date.now()}`,
        content: newMessage,
        role: 'user' as const,
        conversation: activeConversation,
        createdAt: new Date().toISOString()
      };

      setMessages([...messages, tempUserMessage]);
      setNewMessage('');

      // Send the message to the server
      const response = await axios.post('http://localhost:5000/chatbot/messages', {
        conversationId: activeConversation,
        content: tempUserMessage.content,
        taskId
      });

      // Update messages with the user message first
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg._id !== tempUserMessage._id),
        response.data.userMessage
      ]);

      // Set the assistant message as the typing message
      setTypingMessage(response.data.assistantMessage);

      // If the conversation title was updated, update it in the state
      if (response.data.conversationTitle) {
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv._id === activeConversation
              ? { ...conv, title: response.data.conversationTitle }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Error sending message");
      toastManager.addToast("Error sending message", "error", 5000);

      // Restore the message in the text area in case of error
      setNewMessage(messages.find(msg => msg._id === `temp-${Date.now()}`)?.content || newMessage);

      // Remove the temporary message
      setMessages(prevMessages => prevMessages.filter(msg => msg._id !== `temp-${Date.now()}`));
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/chatbot/conversations/${conversationId}`);

      // Update the conversation list
      setConversations(conversations.filter(conv => conv._id !== conversationId));

      // If the deleted conversation was active, select another conversation
      if (activeConversation === conversationId) {
        const remainingConversations = conversations.filter(conv => conv._id !== conversationId);
        setActiveConversation(remainingConversations.length > 0 ? remainingConversations[0]._id : null);
        setMessages([]);
      }

      toastManager.addToast("Conversation deleted successfully", "success", 3000);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setError("Error deleting conversation");
      toastManager.addToast("Error deleting conversation", "error", 5000);
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
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar with conversation list */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Conversations</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={createNewConversation}
            disabled={loading}
          >
            New
          </Button>
        </div>

        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations. Start by creating a new one.
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
                  type="button"
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

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">
            {activeConversation
              ? conversations.find(c => c._id === activeConversation)?.title || "Conversation"
              : "Select or create a conversation"}
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto" ref={messagesContainerRef}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!activeConversation ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a conversation or create a new one to start chatting.
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              No messages. Start the conversation by sending a message.
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

              {/* Typing animation for assistant message */}
              {typingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-3/4 p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <TypingAnimation
                      text={typingMessage.content}
                      speed={3} // Moderate typing speed (3ms per character)
                      onComplete={handleTypingComplete}
                      className="whitespace-pre-wrap"
                    />
                    <div className="text-xs mt-1 opacity-70">
                      {typingMessage.createdAt && formatDate(typingMessage.createdAt)}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Scroll to bottom when user is typing
                scrollToBottom();
              }}
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
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
