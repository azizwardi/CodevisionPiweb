import React, { useState, useEffect, useCallback } from 'react';
import Toast, { ToastType } from './Toast';

// Interface pour un toast individuel
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Créer un gestionnaire global de toasts
export const toastManager = {
  // Référence à la fonction d'ajout de toast (sera définie par le composant)
  addToast: (message: string, type: ToastType, duration?: number) => {},
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Fonction pour ajouter un toast
  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    console.log("Ajout d'un toast:", { message, type, duration });
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  // Fonction pour supprimer un toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Définir la fonction d'ajout dans le gestionnaire global
  useEffect(() => {
    console.log("Initialisation du gestionnaire de toasts");
    toastManager.addToast = addToast;
  }, [addToast]);

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default ToastContainer;
