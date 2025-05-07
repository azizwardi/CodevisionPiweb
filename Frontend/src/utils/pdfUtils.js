/**
 * Utilitaires pour la génération de PDF
 */

// Polyfill pour window.URL
if (typeof window.URL !== 'function' && typeof window.webkitURL === 'function') {
  window.URL = window.webkitURL;
}

// Polyfill pour Blob
if (typeof window.Blob !== 'function') {
  window.Blob = function(parts, options) {
    const bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
    parts.forEach(part => {
      bb.append(part);
    });
    return bb.getBlob(options ? options.type : undefined);
  };
}

/**
 * Fonction pour télécharger un fichier
 * @param {Blob} blob - Le blob à télécharger
 * @param {string} filename - Le nom du fichier
 */
export const downloadBlob = (blob, filename) => {
  try {
    // Méthode 1: Utiliser l'API URL.createObjectURL
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Erreur lors du téléchargement du blob:', error);
    
    // Méthode 2: Utiliser l'API FileReader
    try {
      const reader = new FileReader();
      reader.onload = function() {
        const link = document.createElement('a');
        link.href = reader.result;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      };
      reader.readAsDataURL(blob);
    } catch (fallbackError) {
      console.error('Erreur avec la méthode alternative:', fallbackError);
      alert('Impossible de télécharger le fichier. Veuillez essayer avec un autre navigateur.');
    }
  }
};

/**
 * Fonction pour générer un PDF à partir d'un élément HTML
 * @param {HTMLElement} element - L'élément HTML à convertir en PDF
 * @param {Object} options - Options pour la génération du PDF
 * @returns {Promise<Blob>} - Le blob du PDF généré
 */
export const generatePDF = async (element, options = {}) => {
  // Importer dynamiquement les bibliothèques
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;
  
  // Options par défaut
  const defaultOptions = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    ...options
  };
  
  try {
    // Ajouter une classe temporaire pour optimiser le rendu
    element.classList.add('pdf-export');
    
    // Attendre que le DOM soit complètement rendu
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Générer le canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Créer le PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Convertir en blob
    const blob = pdf.output('blob');
    
    // Supprimer la classe temporaire
    element.classList.remove('pdf-export');
    
    return blob;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    element.classList.remove('pdf-export');
    throw error;
  }
};

/**
 * Fonction pour ouvrir une fenêtre d'impression avec un contenu HTML
 * @param {string} html - Le contenu HTML à imprimer
 * @param {string} title - Le titre de la fenêtre
 */
export const printHTML = (html, title) => {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer le contenu');
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé
    printWindow.onload = function() {
      try {
        printWindow.print();
      } catch (printError) {
        console.error('Erreur lors de l\'impression:', printError);
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
    alert('Impossible d\'ouvrir la fenêtre d\'impression');
  }
};
