import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toastManager } from '../../dashboard/components/ui/toast/ToastContainer';

interface TeamChatNotificationsProps {
  userId: string;
  teamIds: string[];
  currentTeamId?: string;
  onNewMessage?: (teamId: string, message: any) => void;
}

const TeamChatNotifications: React.FC<TeamChatNotificationsProps> = ({
  userId,
  teamIds,
  currentTeamId,
  onNewMessage
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    if (!userId || teamIds.length === 0) return;
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected for team chat notifications');
      
      // Join all team rooms
      teamIds.forEach(teamId => {
        newSocket.emit('joinTeam', teamId);
        console.log(`Joined team room: ${teamId} for notifications`);
      });
    });
    
    // Listen for new messages
    newSocket.on('newTeamMessage', (message) => {
      console.log('New team message received for notification:', message);
      
      // Only show notification if the message is not from the current user
      // and not from the currently viewed team
      if (message.sender._id !== userId && message.team !== currentTeamId) {
        // Get sender name
        const senderName = message.sender.firstName && message.sender.lastName
          ? `${message.sender.firstName} ${message.sender.lastName}`
          : message.sender.username;
        
        // Show notification
        toastManager.addToast(
          `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          'info',
          5000
        );
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.error('Failed to play notification sound:', err));
        
        // Call onNewMessage callback if provided
        if (onNewMessage) {
          onNewMessage(message.team, message);
        }
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        // Leave all team rooms
        teamIds.forEach(teamId => {
          newSocket.emit('leaveTeam', teamId);
        });
        newSocket.disconnect();
      }
    };
  }, [userId, teamIds, currentTeamId, onNewMessage]);
  
  // This component doesn't render anything
  return null;
};

export default TeamChatNotifications;
