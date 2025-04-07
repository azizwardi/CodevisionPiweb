import React from 'react';

interface PopupProps {
  message: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p>{message}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;