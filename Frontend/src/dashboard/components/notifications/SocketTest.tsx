import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Button from '../ui/button/Button';

export default function SocketTest() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [userId, setUserId] = useState('');

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO Test: Connected with ID:', newSocket.id);
      setConnected(true);
      addMessage(`Connecté au serveur Socket.IO avec ID: ${newSocket.id}`);
      
      // Récupérer l'ID utilisateur depuis localStorage
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          const id = parsedUserInfo.id || parsedUserInfo._id || '';
          setUserId(id);
          addMessage(`ID utilisateur récupéré: ${id}`);
        } else {
          addMessage('Aucune information utilisateur trouvée dans localStorage');
        }
      } catch (error) {
        addMessage(`Erreur lors de la récupération de l'ID utilisateur: ${error}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO Test: Disconnected');
      setConnected(false);
      addMessage('Déconnecté du serveur Socket.IO');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO Test: Connection error:', error);
      addMessage(`Erreur de connexion: ${error.message}`);
    });

    newSocket.on('connectionTest', (data) => {
      console.log('Socket.IO Test: Connection test message received:', data);
      addMessage(`Message de test reçu: ${data.message} (${data.timestamp})`);
    });

    newSocket.on('testConnectionResponse', (data) => {
      console.log('Socket.IO Test: Test response received:', data);
      addMessage(`Réponse de test reçue: ${data.message} (${data.timestamp})`);
    });

    newSocket.on('memberAdded', (data) => {
      console.log('Socket.IO Test: Member added notification received:', data);
      addMessage(`Notification reçue: Utilisateur ajouté au projet "${data.projectName}" (${data.timestamp})`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Ajouter un message à la liste
  const addMessage = (message: string) => {
    setMessages((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Rejoindre la room personnelle
  const joinRoom = () => {
    if (socket && userId) {
      socket.emit('joinUser', userId);
      addMessage(`Tentative de rejoindre la room pour l'utilisateur: ${userId}`);
    } else {
      addMessage('Impossible de rejoindre la room: socket non connecté ou ID utilisateur manquant');
    }
  };

  // Envoyer un message de test
  const sendTestMessage = () => {
    if (socket) {
      socket.emit('testConnection', { 
        message: 'Test de connexion depuis le client', 
        userId,
        timestamp: new Date().toISOString() 
      });
      addMessage('Message de test envoyé au serveur');
    } else {
      addMessage('Impossible d\'envoyer le message: socket non connecté');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Test de connexion Socket.IO</h2>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connected ? 'Connecté' : 'Déconnecté'}</span>
        </div>
        
        <div className="mb-2">
          <span className="font-medium">ID Utilisateur: </span>
          <span>{userId || 'Non défini'}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          variant="primary" 
          onClick={joinRoom} 
          disabled={!connected || !userId}
        >
          Rejoindre Room
        </Button>
        
        <Button 
          variant="outline" 
          onClick={sendTestMessage} 
          disabled={!connected}
        >
          Envoyer Test
        </Button>
      </div>
      
      <div className="border rounded p-2 bg-gray-50 dark:bg-gray-700 h-60 overflow-y-auto">
        <h3 className="font-medium mb-2">Messages:</h3>
        <ul className="space-y-1 text-sm">
          {messages.length === 0 ? (
            <li className="text-gray-500">Aucun message</li>
          ) : (
            messages.map((message, index) => (
              <li key={index} className="border-b border-gray-200 dark:border-gray-600 pb-1">
                {message}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
