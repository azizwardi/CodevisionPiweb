import React, { useState, useEffect, useCallback } from 'react';
import Toast, { ToastType } from './Toast';

// Interface pour les paramètres du toast
interface ToastParams {
  title: string;
  description: string;
  type: ToastType;
  duration?: number;
}

// Interface pour un toast individuel
interface ToastItem {
  id: string;
  title: string;
  description: string;
  type: ToastType;
  duration?: number;
}

// Créer un gestionnaire global de toasts
export const toastManager = {
  // Référence à la fonction d'ajout de toast (sera définie par le composant)
  addToast: (params: ToastParams) => {},
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Fonction pour ajouter un toast
  const addToast = useCallback((params: ToastParams) => {
    const { title, description, type, duration } = params;
    console.log("Ajout d'un toast:", { title, description, type, duration });
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type, duration }]);
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
          title={toast.title}
          description={toast.description}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default ToastContainer;
