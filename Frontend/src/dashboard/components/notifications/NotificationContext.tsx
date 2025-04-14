import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toastManager } from '../ui/toast/ToastContainer';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect to Socket.IO server
  useEffect(() => {
    console.log('Initializing Socket.IO connection...');

    // Créer une nouvelle connexion Socket.IO
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Événement de connexion réussie
    newSocket.on('connect', () => {
      console.log('%cSocket.IO connecté avec succès!', 'color: green; font-weight: bold');
      console.log('ID de la socket:', newSocket.id);
      setSocket(newSocket);

      // Envoyer un message de test pour vérifier la connexion
      newSocket.emit('testConnection', { message: 'Test de connexion depuis le client' });

      // Get user ID from localStorage
      const userInfo = localStorage.getItem('userInfo');
      console.log('Raw userInfo from localStorage:', userInfo);
      let userId = '';

      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          console.log('Parsed userInfo:', parsedUserInfo);
          userId = parsedUserInfo.id || parsedUserInfo._id || '';
          console.log('%cUser ID extrait du localStorage:', 'color: blue; font-weight: bold', userId);

          // Join user's room for personalized notifications
          if (userId) {
            console.log('Rejoindre la room pour l\'utilisateur:', userId);
            newSocket.emit('joinUser', userId);

            // Enregistrer l'ID utilisateur dans une variable globale pour débogage
            window.currentUserId = userId;
            console.log('ID utilisateur enregistré dans window.currentUserId pour débogage');
          } else {
            console.warn('Aucun ID utilisateur valide trouvé dans les informations utilisateur');
          }
        } catch (error) {
          console.error('Erreur lors de l\'analyse des informations utilisateur:', error);
        }
      } else {
        console.warn('Aucune information utilisateur trouvée dans localStorage');
      }
    });

    // Événement de réponse au test de connexion
    newSocket.on('testConnectionResponse', (data) => {
      console.log('%cRéponse au test de connexion reçue:', 'color: green', data);
    });

    // Événement de test de connexion
    newSocket.on('connectionTest', (data) => {
      console.log('%cTest de connexion reçu du serveur:', 'color: green', data);
    });

    // Événements d'erreur
    newSocket.on('connect_error', (error) => {
      console.error('%cErreur de connexion Socket.IO:', 'color: red; font-weight: bold', error);
    });

    newSocket.on('error', (error) => {
      console.error('%cErreur Socket.IO:', 'color: red; font-weight: bold', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('%cSocket.IO déconnecté:', 'color: orange', reason);
    });

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('Déconnexion de Socket.IO...');
      newSocket.disconnect();
    };
  }, []);

  // Listen for notifications
  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized yet, skipping notification listener setup');
      return;
    }

    console.log('Setting up notification listeners with socket ID:', socket.id);

    // Get user ID from localStorage
    const userInfo = localStorage.getItem('userInfo');
    let currentUserId = '';

    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        // Try different possible ID fields
        currentUserId = parsedUserInfo.id || parsedUserInfo._id || parsedUserInfo.userId || '';
        console.log('Current user ID for notifications:', currentUserId);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    } else {
      console.warn('No userInfo found in localStorage for notification filtering');
    }

    // Listen for member added notification
    socket.on('memberAdded', (data) => {
      console.log('Notification reçue:', data);

      // Déterminer le type de notification et le message approprié
      let shouldShowNotification = false;
      let notificationType = 'project-member-added';
      let notificationMessage = '';
      let notificationVariant: 'info' | 'success' | 'warning' | 'error' = 'info';

      // Afficher des informations détaillées sur la notification reçue
      console.log('Détails de la notification reçue:', {
        type: data.type,
        forUserId: data.forUserId,
        targetUserId: data.targetUserId,
        userId: data.userId,
        adminId: data.adminId,
        message: data.message,
        currentUserId: currentUserId
      });

      // Vérifier si c'est une notification en temps réel
      const isRealtimeNotification = data.realtime === true;

      if (isRealtimeNotification) {
        console.log('%cNotification en temps réel reçue!', 'color: green; font-weight: bold');
      }

      // Vérifier si cette notification est destinée à l'utilisateur courant
      const isForCurrentUser =
        // Si forUserId est défini, vérifier s'il correspond à l'utilisateur courant
        (data.forUserId && data.forUserId === currentUserId) ||
        // Sinon, vérifier les autres champs d'ID
        (data.type === 'member_notification' && data.targetUserId === currentUserId) ||
        (data.type === 'admin_notification' && data.adminId === currentUserId);

      // Pour les notifications en temps réel, accepter toutes les notifications pour débogage
      const shouldAcceptNotification = isRealtimeNotification || isForCurrentUser;

      console.log(`Cette notification ${isRealtimeNotification ? 'en temps réel ' : ''}est-elle pour l'utilisateur courant? ${isForCurrentUser}`);
      console.log(`Décision finale: ${shouldAcceptNotification ? 'Accepter' : 'Ignorer'} cette notification`);

      if (data.type === 'member_notification') {
        // Notification pour le membre ajouté
        if (shouldAcceptNotification) {
          shouldShowNotification = true;
          notificationMessage = data.message || `Vous avez été ajouté au projet "${data.projectName}"`;
          notificationType = 'project-member-added';
          notificationVariant = 'info';
          console.log(`Notification de membre acceptée pour l'utilisateur ${currentUserId}`);
        } else {
          console.log(`Notification de membre ignorée car elle n'est pas destinée à l'utilisateur ${currentUserId}`);
        }
      }
      else if (data.type === 'admin_notification') {
        // Notification pour l'administrateur qui a ajouté le membre
        if (shouldAcceptNotification) {
          shouldShowNotification = true;
          notificationMessage = data.message || "affectation reussite";
          notificationType = 'project-admin-action';
          notificationVariant = 'success';
          console.log(`Notification d'admin acceptée pour l'utilisateur ${currentUserId}`);
        } else {
          console.log(`Notification d'admin ignorée car elle n'est pas destinée à l'utilisateur ${currentUserId}`);
        }
      }
      else if (data.type === 'test_notification') {
        // Notification de test (toujours acceptée)
        shouldShowNotification = true;
        notificationMessage = data.message || "Notification de test";
        notificationType = 'test-notification';
        notificationVariant = 'info';
        console.log(`Notification de test acceptée`);
      }
      else {
        // Ancien format de notification (pour compatibilité)
        if (shouldAcceptNotification) {
          shouldShowNotification = true;
          notificationMessage = `Vous avez été ajouté au projet "${data.projectName}"`;
          notificationType = 'project-member-added';
          notificationVariant = 'info';
          console.log(`Notification (ancien format) acceptée pour l'utilisateur ${currentUserId}`);
        } else {
          console.log(`Notification (ancien format) ignorée car elle n'est pas destinée à l'utilisateur ${currentUserId}`);
        }
      }

      // Afficher la notification si nécessaire
      if (shouldShowNotification) {
        const notification: Notification = {
          id: Date.now().toString(),
          type: notificationType,
          message: notificationMessage,
          read: false,
          createdAt: new Date(),
          data
        };

        setNotifications(prev => [notification, ...prev]);

        // Show toast notification with special styling for real-time notifications
        if (data.realtime) {
          // Notification en temps réel - style spécial
          toastManager.addToast(
            notificationMessage,
            notificationVariant,
            8000,  // Durée plus longue pour les notifications en temps réel
            {
              className: 'realtime-notification',
              icon: data.type === 'admin_notification' ? 'check-circle' : 'bell'
            }
          );
        } else {
          // Notification normale
          toastManager.addToast(
            notificationMessage,
            notificationVariant,
            5000
          );
        }
      } else {
        console.log('Notification ignorée car elle ne correspond pas aux critères de l\'utilisateur actuel');
      }
    });

    return () => {
      socket.off('memberAdded');
    };
  }, [socket]);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
