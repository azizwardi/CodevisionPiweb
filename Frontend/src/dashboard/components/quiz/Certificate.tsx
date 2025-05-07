import React, { useRef } from 'react';
import { formatDate } from '../../utils/formatDate';
import Button from '../ui/button/Button';
import { generatePDF, downloadBlob, printHTML } from '../../../utils/pdfUtils';

interface CertificateProps {
  certificate: {
    _id: string;
    certificateId: string;
    user: {
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    quiz: {
      _id: string;
      title: string;
      category: string;
    };
    score: number;
    maxScore: number;
    percentage: number;
    issueDate: string;
  };
  newGrade: string;
  oldGrade?: string | null;
  gradeUpgraded: boolean;
  onClose: () => void;
}

const Certificate: React.FC<CertificateProps> = ({
  certificate,
  newGrade,
  oldGrade,
  gradeUpgraded,
  onClose
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Fonction pour télécharger le certificat en PDF
  const downloadCertificate = async () => {
    if (!certificateRef.current) {
      console.error("Référence au certificat non trouvée");
      alert("Impossible de générer le certificat : référence non trouvée");
      return;
    }

    try {
      console.log("Début de la génération du certificat...");

      // Utiliser notre fonction utilitaire pour générer le PDF
      const pdfBlob = await generatePDF(certificateRef.current, {
        scale: 2,
        logging: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      // Utiliser un nom de fichier sécurisé
      const safeTitle = certificate.quiz.title
        .replace(/[^\w\s]/gi, '') // Supprimer les caractères spéciaux
        .replace(/\s+/g, '_'); // Remplacer les espaces par des underscores

      const filename = `certificat_${safeTitle}_${Date.now()}.pdf`;
      console.log("Téléchargement du PDF:", filename);

      // Télécharger le PDF
      downloadBlob(pdfBlob, filename);
      console.log("PDF téléchargé avec succès");

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);

      // Méthode alternative si la première méthode échoue
      try {
        console.log("Tentative avec méthode alternative...");

        // Créer le contenu HTML du certificat
        const certificateHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Certificat - ${certificate.quiz.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f5f5f5;
              }
              .certificate {
                width: 800px;
                background-color: white;
                border: 16px double #ccc;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .title {
                font-size: 32px;
                font-weight: bold;
                color: #333;
                margin-bottom: 16px;
              }
              .divider {
                width: 120px;
                height: 4px;
                background-color: #3b82f6;
                margin: 0 auto 32px;
              }
              .recipient {
                font-size: 24px;
                font-weight: bold;
                color: #3b82f6;
                margin: 32px 0;
              }
              .score {
                font-size: 28px;
                font-weight: bold;
                color: #22c55e;
                margin: 24px 0;
              }
              .quiz-title {
                font-size: 20px;
                font-weight: 600;
                color: #333;
                margin: 24px 0 32px;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 48px;
                font-size: 14px;
              }
              .footer-item {
                text-align: center;
              }
              .footer-label {
                color: #666;
                margin-bottom: 4px;
              }
              .footer-value {
                font-weight: 500;
              }
              .print-button {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
              @media print {
                body {
                  background-color: white;
                }
                .certificate {
                  box-shadow: none;
                }
                .print-button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <button class="print-button" onclick="window.print()">Imprimer</button>
            <div class="certificate">
              <div class="title">Certificat d'Excellence</div>
              <div class="divider"></div>

              <p>Ce certificat est décerné à</p>

              <div class="recipient">${getUserFullName()}</div>

              <p>pour avoir obtenu un score parfait de</p>

              <div class="score">${certificate.score}/${certificate.maxScore} (${certificate.percentage}%)</div>

              <p>dans le quiz</p>

              <div class="quiz-title">${getQuizTitle()}</div>

              <div class="footer">
                <div class="footer-item">
                  <div class="footer-label">La catégorie du quiz choisi</div>
                  <div class="footer-value">${getQuizCategory()}</div>
                </div>

                <div class="footer-item">
                  <div class="footer-label">Grade</div>
                  <div class="footer-value">Super Member</div>
                </div>

                <div class="footer-item">
                  <div class="footer-label">Date</div>
                  <div class="footer-value">${formatDate(certificate.issueDate)}</div>
                </div>

                <div class="footer-item">
                  <div class="footer-label">Certificat ID</div>
                  <div class="footer-value">${certificate.certificateId}</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Utiliser notre fonction utilitaire pour imprimer le HTML
        printHTML(certificateHTML, `Certificat - ${certificate.quiz.title}`);
        console.log('Certificat généré avec succès (méthode alternative)');
      } catch (alternativeError) {
        console.error('Erreur avec la méthode alternative:', alternativeError);
        alert(`Impossible de générer le certificat. Veuillez réessayer plus tard.`);
      }
    }
  };

  // Formater le nom complet de l'utilisateur
  const getUserFullName = () => {
    if (certificate.user.firstName && certificate.user.lastName) {
      return `${certificate.user.firstName} ${certificate.user.lastName}`;
    } else if (certificate.user.username) {
      return certificate.user.username;
    } else if (certificate.user.email) {
      // Utiliser l'email sans le domaine comme nom d'utilisateur
      return certificate.user.email.split('@')[0];
    }
    return "Utilisateur";
  };

  // Obtenir le titre du quiz de manière sécurisée
  const getQuizTitle = () => {
    return certificate.quiz?.title || "Quiz";
  };

  // Obtenir la catégorie du quiz de manière sécurisée
  const getQuizCategory = () => {
    return certificate.quiz?.category || "Générale";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Message de félicitations pour l'évolution de grade */}
      {gradeUpgraded && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
            Félicitations !
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Vous avez évolué du grade <span className="font-semibold">{oldGrade}</span> au grade <span className="font-semibold">{newGrade}</span> !
          </p>
        </div>
      )}

      {/* Certificat */}
      <div
        ref={certificateRef}
        className="w-full max-w-3xl bg-white border-8 border-double border-gray-300 p-8 rounded-lg shadow-lg"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Certificat d'Excellence</h2>
          <div className="w-32 h-1 bg-blue-600 mx-auto mb-6"></div>

          <p className="text-lg text-gray-600 mb-2">
            Ce certificat est décerné à
          </p>

          <h3 className="text-2xl font-bold text-blue-600 mb-8">
            {getUserFullName()}
          </h3>

          <p className="text-lg text-gray-600 mb-2">
            pour avoir obtenu un score parfait de
          </p>

          <div className="text-3xl font-bold text-green-600 mb-8">
            {certificate.score}/{certificate.maxScore} ({certificate.percentage}%)
          </div>

          <p className="text-lg text-gray-600 mb-2">
            dans le quiz
          </p>

          <h4 className="text-xl font-semibold text-gray-800 mb-8">
            {getQuizTitle()}
          </h4>

          <div className="flex justify-between items-center mt-12">
            <div>
              <p className="text-sm text-gray-500">La catégorie du quiz choisi</p>
              <p className="font-medium">{getQuizCategory()}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-medium">Super Member</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(certificate.issueDate)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Certificat ID</p>
              <p className="font-medium">{certificate.certificateId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 mt-6">
        <Button variant="primary" onClick={downloadCertificate}>
          Télécharger le certificat
        </Button>
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default Certificate;
