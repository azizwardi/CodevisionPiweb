import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';
import Button from '../../dashboard/components/ui/button/Button';
import { Textarea } from '../../dashboard/components/ui/form/textarea';
import TeamMembersList from '../../shared/components/TeamMembersList';

interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface TeamMember {
  user: User;
  skills: Array<{
    skill: string;
    level: number;
  }>;
  addedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  teamLeader: User;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  team: string;
  sender: User;
  content: string;
  createdAt: string;
  readBy: string[];
}

interface TeamChatInterfaceProps {
  teamId: string;
  userId: string;
  team: Team;
}

const TeamChatInterface: React.FC<TeamChatInterfaceProps> = ({ teamId, userId, team }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to socket.io
  useEffect(() => {
    console.log('Member - Setting up socket connection for team:', teamId);

    try {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('Member - Socket.IO connected for team chat with socket ID:', newSocket.id);
        // Join the team room
        newSocket.emit('joinTeam', teamId);
        console.log('Member - Emitted joinTeam event for team:', teamId);

        // Emit user online status
        newSocket.emit('userOnline', { teamId, userId });

        // Emit a test message to verify connection
        newSocket.emit('testConnection', { teamId, userId });
      });

      newSocket.on('connect_error', (error) => {
        console.error('Member - Socket.IO connection error:', error);
      });

      newSocket.on('teamJoined', (data) => {
        console.log('Member - Team room joined confirmation received:', data);
      });

      newSocket.on('newTeamMessage', (message: any) => {
        console.log('New team message received:', message);

        // Check if this message already exists in our state
        setMessages(prevMessages => {
          // If the message already exists, don't add it again
          if (prevMessages.some(m => m._id === message._id)) {
            console.log('Message already exists in state');
            return prevMessages;
          }

          // If this is a message from another user, just add it
          if (message.sender._id !== userId) {
            console.log('Adding message from another user');

            // Force scroll to bottom
            setTimeout(() => {
              scrollToBottom();
            }, 50);

            return [...prevMessages, message];
          }

          // If this is our own message, check if we have a temporary version
          if (message.tempMessageId) {
            const tempIndex = prevMessages.findIndex(m => m._id === message.tempMessageId);

            if (tempIndex !== -1) {
              console.log('Replacing temporary message with real one');
              const newMessages = [...prevMessages];
              newMessages[tempIndex] = message;

              // Force scroll to bottom
              setTimeout(() => {
                scrollToBottom();
              }, 50);

              return newMessages;
            }
          }

          // If we get here, it's our message but we don't have a temp version
          // Just add it to the list
          console.log('Adding our own message (no temp found)');

          // Force scroll to bottom
          setTimeout(() => {
            scrollToBottom();
          }, 50);

          return [...prevMessages, message];
        });
      });

      // Handle message sent confirmation
      newSocket.on('messageSent', (data: any) => {
        console.log('Member - Message sent confirmation received:', data);

        if (data.tempMessageId) {
          // The temporary message was successfully sent and saved
          console.log('Member - Temporary message was successfully sent:', data.tempMessageId);
        }
      });

      // Handle message error
      newSocket.on('messageError', (data: any) => {
        console.error('Member - Message error received:', data);

        if (data.tempMessageId) {
          toastManager.addToast('Failed to send message', 'error', 5000);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Member - Socket.IO disconnected from team chat');
      });

      setSocket(newSocket);

      return () => {
        console.log('Member - Cleaning up socket connection for team:', teamId);
        // Emit user offline status
        newSocket.emit('userOffline', { teamId, userId });
        // Leave the team room when component unmounts
        newSocket.emit('leaveTeam', teamId);
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('Member - Error setting up socket connection:', error);
    }
  }, [teamId, userId]);

  // Fetch messages when team changes
  useEffect(() => {
    if (teamId) {
      console.log('Team ID changed, fetching messages for team:', teamId);
      fetchMessages();
    }
  }, [teamId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching messages from API for team:', teamId);

      try {
        const response = await axios.get(`http://localhost:5000/team-chat/${teamId}/messages`);
        console.log('Messages API response status:', response.status);
        console.log('Messages API response data:', response.data);

        if (response.data && Array.isArray(response.data.messages) && response.data.messages.length > 0) {
          console.log(`Loaded ${response.data.messages.length} messages from server`);

          // Ensure all messages have proper sender information
          const processedMessages = response.data.messages.map((msg: any) => {
            // If the sender is the current user but doesn't have the right display name
            if (msg.sender._id === userId && msg.sender.username !== 'You') {
              return {
                ...msg,
                sender: {
                  ...msg.sender,
                  username: 'You'
                }
              };
            }
            return msg;
          });

          setMessages(processedMessages);

          // Scroll to bottom after messages are loaded
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          console.log('No messages found from API');

          // Try to send a first message to initialize the chat
          const initialMessage: Message = {
            _id: `initial-${Date.now()}`,
            team: teamId,
            sender: {
              _id: userId,
              username: 'You',
              email: '',
              firstName: '',
              lastName: ''
            },
            content: 'Hello team! I just joined the chat.',
            createdAt: new Date().toISOString(),
            readBy: [userId]
          };

          console.log('Sending initial message to server');

          try {
            const sendResponse = await axios.post('http://localhost:5000/team-chat/messages', {
              teamId,
              senderId: userId,
              content: initialMessage.content
            });

            console.log('Initial message sent successfully:', sendResponse.data);

            if (sendResponse.data && sendResponse.data.chatMessage) {
              // Ensure the sender is properly formatted for display
              const chatMessage = sendResponse.data.chatMessage;
              if (chatMessage.sender._id === userId) {
                chatMessage.sender.username = 'You';
              }
              setMessages([chatMessage]);
            } else {
              setMessages([initialMessage]);
            }
          } catch (sendError) {
            console.error('Error sending initial message:', sendError);
            setMessages([initialMessage]);
          }
        }
      } catch (apiError) {
        console.error('API error fetching messages:', apiError);
        setError('Failed to load messages. Please try again later.');
        toastManager.addToast('Failed to load messages', 'error', 5000);
      }
    } catch (error) {
      console.error('Error in fetchMessages function:', error);
      setError('Failed to load messages');
      toastManager.addToast('Failed to load messages', 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setLoading(true);

      const messageContent = newMessage;

      // Clear input field immediately
      setNewMessage('');

      // Create a temporary message with proper sender information
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        team: teamId,
        sender: {
          _id: userId,
          username: 'You', // Important: Set username to 'You' for display purposes
          email: '',
          firstName: '',
          lastName: ''
        },
        content: messageContent,
        createdAt: new Date().toISOString(),
        readBy: [userId]
      };

      // Add the temporary message to the UI immediately
      console.log('Adding temporary message to UI');
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Send the message to the server
      try {
        console.log('Sending message to server');
        const response = await axios.post('http://localhost:5000/team-chat/messages', {
          teamId,
          senderId: userId,
          content: messageContent
        });

        console.log('Message sent successfully, response:', response.data);

        // Ensure the real message has the correct sender display name
        if (response.data && response.data.chatMessage) {
          const realMessage = response.data.chatMessage;
          realMessage.sender.username = 'You'; // Override the username for display

          // If we have a socket, emit the message with the correct display name
          if (socket && socket.connected) {
            socket.emit('newTeamMessage', {
              ...realMessage,
              tempMessageId: tempMessage._id
            });
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toastManager.addToast('Failed to send message', 'error', 5000);
      }
    } catch (error) {
      console.error('Error in sendMessage function:', error);
      toastManager.addToast('Failed to send message', 'error', 5000);
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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      console.log('Member - Scrolling to bottom of messages');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.log('Member - messagesEndRef is not available for scrolling');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user: User) => {
    // If the user is the current user, return "You"
    if (user._id === userId) {
      return "You";
    }

    // If the user has a first name and last name, use them
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    // Otherwise, use the username or a fallback
    return user.username || "User";
  };

  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 font-bold">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{team.name}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {team.members.length + 1} members • {team.members.filter(m => m.user._id !== userId).length} online
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-2 rounded-full transition-colors ${
              showMembers
                ? 'bg-blue-500/10 text-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={showMembers ? "Hide members" : "Show members"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className={`${showMembers ? 'w-2/3' : 'w-full'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-opacity-25 border-t-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No messages yet</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Be the first to send a message!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.sender._id === userId;
                const showDate = index === 0 ||
                  formatDate(messages[index-1].createdAt) !== formatDate(message.createdAt);
                const isTempMessage = message._id.startsWith('temp-');

                return (
                  <React.Fragment key={message._id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.createdAt)}
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex items-end ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2 text-xs font-bold">
                          {message.sender.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white rounded-br-none border-2 border-blue-600'
                            : 'bg-white dark:bg-gray-700 rounded-bl-none'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="font-semibold text-xs mb-1 text-gray-600 dark:text-gray-300">
                            {getUserDisplayName(message.sender)}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                      {isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ml-2 text-xs font-bold">
                          {message.sender.username?.charAt(0).toUpperCase() || 'Y'}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} id="messages-end-ref" />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-end space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none border-0 bg-transparent focus:ring-0 text-sm"
                rows={1}
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="rounded-full w-10 h-10 flex items-center justify-center p-0 bg-blue-500 hover:bg-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Team Members Sidebar */}
        {showMembers && (
          <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto transition-all duration-300">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Team Members</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{team.members.length + 1} members</p>
            </div>
            <TeamMembersList team={team} currentUserId={userId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamChatInterface;
