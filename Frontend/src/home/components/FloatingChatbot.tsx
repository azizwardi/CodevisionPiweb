import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { styled } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  Zoom,
  CircularProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

// Types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  _id: string;
  messages: Message[];
}

// Styled components
const ChatButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 1000,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 90,
  right: 20,
  width: 350,
  height: 500,
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  overflow: 'hidden',
  boxShadow: theme.shadows[10],
  borderRadius: theme.shape.borderRadius * 2,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(1.5),
  wordWrap: 'break-word',
  backgroundColor: isUser
    ? theme.palette.primary.main
    : theme.palette.grey[100],
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  display: 'flex',
  flexDirection: 'column',
}));

const ChatInputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
}));

const FloatingChatbot: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effet pour afficher automatiquement le chatbot après un délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
      // Ajouter un message de bienvenue
      setMessages([
        {
          id: 'welcome',
          content: "Bonjour ! Je suis l'assistant virtuel de CodevisionPiweb. Comment puis-je vous aider aujourd'hui ?",
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    }, 3000); // Afficher après 3 secondes

    return () => clearTimeout(timer);
  }, []);

  // Effet pour faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fonction pour créer une nouvelle conversation
  const createNewConversation = async () => {
    try {
      setLoading(true);

      // Générer un ID temporaire unique pour les utilisateurs non connectés
      const tempUserId = user?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      console.log("Création d'une nouvelle conversation avec userId:", tempUserId);

      const response = await axios.post('http://localhost:5000/chatbot/conversations', {
        userId: tempUserId,
        title: "Conversation depuis la page d'accueil"
      });

      console.log("Conversation créée avec succès:", response.data);
      setConversationId(response.data.conversation._id);
      return response.data.conversation._id;
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);

      // En cas d'erreur, créer une conversation locale
      const localConversationId = `local_${Date.now()}`;
      console.log("Création d'une conversation locale:", localConversationId);
      setConversationId(localConversationId);
      return localConversationId;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Créer une nouvelle conversation si nécessaire
    const activeConversationId = conversationId || await createNewConversation();
    if (!activeConversationId) return;

    // Ajouter temporairement le message de l'utilisateur
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      role: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setNewMessage('');
    setLoading(true);

    // Vérifier si c'est une conversation locale (hors ligne)
    const isLocalConversation = activeConversationId.startsWith('local_');

    if (isLocalConversation) {
      // Mode hors ligne - simuler une réponse
      setTimeout(() => {
        const userMessage = {
          id: `user-${Date.now()}`,
          content: tempUserMessage.content,
          role: 'user' as const,
          timestamp: new Date()
        };

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          content: "Je suis désolé, mais je ne peux pas traiter votre demande actuellement car le serveur est indisponible. Veuillez réessayer plus tard ou rafraîchir la page.",
          role: 'assistant' as const,
          timestamp: new Date()
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== tempUserMessage.id),
          userMessage,
          assistantMessage
        ]);
        setLoading(false);
      }, 1000);

      return;
    }

    try {
      // Envoyer le message au serveur
      const response = await axios.post('http://localhost:5000/chatbot/messages', {
        conversationId: activeConversationId,
        content: tempUserMessage.content
      });

      // Mettre à jour les messages avec les réponses du serveur
      const userMessage = {
        id: response.data.userMessage._id,
        content: response.data.userMessage.content,
        role: 'user' as const,
        timestamp: new Date(response.data.userMessage.createdAt)
      };

      const assistantMessage = {
        id: response.data.assistantMessage._id,
        content: response.data.assistantMessage.content,
        role: 'assistant' as const,
        timestamp: new Date(response.data.assistantMessage.createdAt)
      };

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id),
        userMessage,
        assistantMessage
      ]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);

      // En cas d'erreur, ajouter un message d'erreur
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id),
        {
          id: `user-${Date.now()}`,
          content: tempUserMessage.content,
          role: 'user',
          timestamp: new Date()
        },
        {
          id: `error-${Date.now()}`,
          content: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard ou rafraîchir la page.",
          role: 'assistant',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'appui sur Entrée pour envoyer un message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formater la date
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Bouton pour ouvrir/fermer le chatbot */}
      <ChatButton
        color="primary"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </ChatButton>

      {/* Fenêtre de chat */}
      <Zoom in={open}>
        <ChatWindow>
          <ChatHeader>
            <Box display="flex" alignItems="center">
              <SmartToyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Assistant CodevisionPiweb</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </ChatHeader>

          <ChatMessages>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 32,
                      height: 32,
                      mr: 1
                    }}
                  >
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                )}

                <MessageBubble isUser={message.role === 'user'}>
                  <Typography variant="body2">{message.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      alignSelf: message.role === 'user' ? 'flex-start' : 'flex-end',
                      opacity: 0.7,
                      mt: 0.5
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </MessageBubble>

                {message.role === 'user' && (
                  <Avatar
                    sx={{
                      bgcolor: 'grey.300',
                      width: 32,
                      height: 32,
                      ml: 1
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box display="flex" justifyContent="flex-start" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                    mr: 1
                  }}
                >
                  <SmartToyIcon fontSize="small" />
                </Avatar>
                <MessageBubble isUser={false}>
                  <CircularProgress size={20} thickness={4} />
                </MessageBubble>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </ChatMessages>

          <ChatInputArea>
            <TextField
              fullWidth
              placeholder="Tapez votre message..."
              variant="outlined"
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              sx={{ mr: 1 }}
            />
            <Tooltip title="Envoyer">
              <IconButton
                color="primary"
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
          </ChatInputArea>
        </ChatWindow>
      </Zoom>
    </>
  );
};

export default FloatingChatbot;
