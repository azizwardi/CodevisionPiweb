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
import TypingAnimation from '../../components/TypingAnimation';

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
  const [typingMessage, setTypingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Effect to automatically display the chatbot after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
      // Add a welcome message as typing
      setTypingMessage({
        id: 'welcome',
        content: "Hello! I'm the CodevisionPiweb virtual assistant. How can I help you with your projects and tasks today?",
        role: 'assistant',
        timestamp: new Date()
      });
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Effect to scroll down when new messages are added
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

  // Function to create a new conversation
  const createNewConversation = async () => {
    try {
      setLoading(true);

      // Generate a unique temporary ID for non-logged-in users
      const tempUserId = user?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      console.log("Creating a new conversation with userId:", tempUserId);

      const response = await axios.post('http://localhost:5000/chatbot/conversations', {
        userId: tempUserId,
        title: "Home page conversation"
      });

      console.log("Conversation created successfully:", response.data);
      setConversationId(response.data.conversation._id);
      return response.data.conversation._id;
    } catch (error) {
      console.error("Error creating conversation:", error);

      // In case of error, create a local conversation
      const localConversationId = `local_${Date.now()}`;
      console.log("Creating a local conversation:", localConversationId);
      setConversationId(localConversationId);
      return localConversationId;
    } finally {
      setLoading(false);
    }
  };

  // Function to send a message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Create a new conversation if needed
    const activeConversationId = conversationId || await createNewConversation();
    if (!activeConversationId) return;

    // Temporarily add the user message
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      role: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setNewMessage('');
    setLoading(true);

    // Check if it's a local conversation (offline)
    const isLocalConversation = activeConversationId.startsWith('local_');

    if (isLocalConversation) {
      // Offline mode - simulate a response
      setTimeout(() => {
        const userMessage = {
          id: `user-${Date.now()}`,
          content: tempUserMessage.content,
          role: 'user' as const,
          timestamp: new Date()
        };

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          content: "I'm sorry, but I cannot process your request at the moment because the server is unavailable. Please try again later or refresh the page.",
          role: 'assistant' as const,
          timestamp: new Date()
        };

        // Add user message to the chat
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== tempUserMessage.id),
          userMessage
        ]);

        // Set the assistant message as typing
        setTypingMessage(assistantMessage);
        setLoading(false);
      }, 1000);

      return;
    }

    try {
      // Send the message to the server
      const response = await axios.post('http://localhost:5000/chatbot/messages', {
        conversationId: activeConversationId,
        content: tempUserMessage.content
      });

      // Update messages with user message first
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

      // Add user message to the chat
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id),
        userMessage
      ]);

      // Set the assistant message as typing
      setTypingMessage(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);

      // In case of error, add an error message
      const userMsg = {
        id: `user-${Date.now()}`,
        content: tempUserMessage.content,
        role: 'user' as const,
        timestamp: new Date()
      };

      const errorMsg = {
        id: `error-${Date.now()}`,
        content: "Sorry, an error occurred. Please try again later or refresh the page.",
        role: 'assistant' as const,
        timestamp: new Date()
      };

      // Add user message to the chat
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id),
        userMsg
      ]);

      // Set the error message as typing
      setTypingMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press to send a message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format the date
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Button to open/close the chatbot */}
      <ChatButton
        color="primary"
        onClick={() => {
          const newOpenState = !open;
          setOpen(newOpenState);
          if (newOpenState) {
            // When opening the chat, scroll to bottom after a short delay
            setTimeout(scrollToBottom, 100);
          }
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </ChatButton>

      {/* Chat window */}
      <Zoom in={open}>
        <ChatWindow>
          <ChatHeader>
            <Box display="flex" alignItems="center">
              <SmartToyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">CodevisionPiweb Assistant</Typography>
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
            <Box ref={messagesContainerRef} sx={{ height: '100%', overflow: 'hidden' }}>
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

            {/* Typing animation for assistant message */}
            {typingMessage && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  mb: 2
                }}
              >
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
                  <TypingAnimation
                    text={typingMessage.content}
                    speed={3} // Moderate typing speed (3ms per character)
                    onComplete={handleTypingComplete}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      alignSelf: 'flex-end',
                      opacity: 0.7,
                      mt: 0.5
                    }}
                  >
                    {formatTime(typingMessage.timestamp)}
                  </Typography>
                </MessageBubble>
              </Box>
            )}

            {loading && !typingMessage && (
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
            </Box>
          </ChatMessages>

          <ChatInputArea>
            <TextField
              fullWidth
              placeholder="Type your message..."
              variant="outlined"
              size="small"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Scroll to bottom when user is typing
                scrollToBottom();
              }}
              onKeyDown={handleKeyPress}
              disabled={loading}
              sx={{ mr: 1 }}
            />
            <Tooltip title="Send">
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
