import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Types de toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Props pour le composant Toast
interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

// Composant Toast
const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Styles basés sur le type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-500 text-white';
      case 'error':
        return 'bg-error-500 text-white';
      case 'warning':
        return 'bg-warning-500 text-white';
      case 'info':
      default:
        return 'bg-brand-500 text-white';
    }
  };

  // Fermer le toast après la durée spécifiée
  useEffect(() => {
    console.log("Toast monté avec le message:", message);
    const timer = setTimeout(() => {
      console.log("Fermeture du toast après", duration, "ms");
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation avant de fermer
    }, duration);

    return () => {
      console.log("Nettoyage du timer du toast");
      clearTimeout(timer);
    };
  }, [duration, onClose, message]);

  // Animation de sortie
  const animationClass = isVisible
    ? 'animate-fade-in opacity-100 translate-y-0'
    : 'animate-fade-out opacity-0 translate-y-2';



  // Créer un portail pour le toast
  return createPortal(
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg transition-all duration-300 ${animationClass} ${getTypeStyles()}`}
      role="alert"
    >
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-white hover:text-white/80"
          aria-label="Fermer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
