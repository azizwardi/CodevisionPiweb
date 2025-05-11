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
  addToast: (params: ToastParams | string, type?: ToastType, duration?: number) => {
    // Cette fonction sera remplacée par l'implémentation réelle
    console.warn("Toast manager not initialized yet");
  },
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

    // Fonction qui gère à la fois l'ancien et le nouveau format
    toastManager.addToast = (paramsOrMessage: ToastParams | string, typeOrUndefined?: ToastType, durationOrUndefined?: number) => {
      // Si le premier paramètre est un objet, c'est le nouveau format
      if (typeof paramsOrMessage === 'object') {
        addToast(paramsOrMessage);
      }
      // Sinon, c'est l'ancien format (message, type, duration)
      else {
        const message = paramsOrMessage;
        const type = typeOrUndefined || 'info';
        const duration = durationOrUndefined || 5000;

        addToast({
          title: type.charAt(0).toUpperCase() + type.slice(1),
          description: message,
          type: type,
          duration: duration
        });
      }
    };
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
