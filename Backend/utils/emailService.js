const nodemailer = require('nodemailer');

// Variable pour stocker le transporteur d'emails
let transporter;

// Fonction pour créer un transporteur de test (Ethereal)
const createTestAccount = async () => {
  try {
    // Créer un compte de test Ethereal
    const testAccount = await nodemailer.createTestAccount();
    console.log('Compte de test Ethereal créé:', testAccount.user);

    // Créer un transporteur avec le compte de test
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du compte de test:', error);
    throw error;
  }
};

// Fonction pour initialiser le transporteur
const initializeTransporter = async () => {
  // Vérifier si nous devons utiliser un compte de test
  const useTestAccount = process.env.USE_TEST_EMAIL === 'true';

  if (useTestAccount) {
    // Utiliser un compte de test Ethereal
    console.log('Utilisation d\'un compte de test Ethereal pour l\'envoi d\'emails');
    try {
      transporter = await createTestAccount();
      console.log('Transporteur Ethereal initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du transporteur Ethereal:', error);
      // Fallback à un transporteur qui ne fait rien (pour éviter les erreurs)
      transporter = {
        sendMail: (options) => {
          console.log('Mode simulation: Email qui aurait été envoyé:', options);
          return Promise.resolve({ messageId: 'simulation-mode', preview: 'Pas de prévisualisation disponible (mode simulation)' });
        }
      };
      console.log('Transporteur de secours (simulation) initialisé');
    }
  } else {
    // Utiliser un service d'email réel (Gmail)
    console.log('Utilisation d\'un service d\'email réel pour l\'envoi d\'emails');

    // Configuration pour un service SMTP générique
    // Vous pouvez utiliser Gmail, Outlook, Yahoo, etc.
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true pour le port 465, false pour les autres ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        // Ne pas échouer en cas de certificats non valides
        rejectUnauthorized: false
      }
    });

    console.log('Transporteur Gmail initialisé avec l\'adresse:', process.env.EMAIL_USER);
  }
};

// Initialiser le transporteur au démarrage
initializeTransporter().catch(error => {
  console.error('Erreur lors de l\'initialisation du transporteur d\'emails:', error);
});

/**
 * Envoie un email
 * @param {string} to - Adresse email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} text - Contenu texte de l'email
 * @param {string} html - Contenu HTML de l'email (optionnel)
 * @returns {Promise} - Promesse résolue avec les informations d'envoi ou rejetée avec une erreur
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Vérifier si le transporteur est initialisé
    if (!transporter) {
      console.log('Le transporteur d\'emails n\'est pas encore initialisé, tentative d\'initialisation...');
      await initializeTransporter();
    }

    // Options de l'email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'votre-email@gmail.com',
      to,
      subject,
      text,
      html: html || text
    };

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', info.messageId);

    // Si nous utilisons Ethereal, afficher l'URL de prévisualisation
    if (process.env.USE_TEST_EMAIL === 'true') {
      const previewURL = nodemailer.getTestMessageUrl(info);
      console.log('\n==================================================');
      console.log('VISUALISER L\'EMAIL DE NOTIFICATION ICI:');
      console.log(previewURL);
      console.log('==================================================\n');
    }

    return info;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Envoie un email de notification d'assignation à un projet
 * @param {string} to - Adresse email du destinataire
 * @param {string} userName - Nom de l'utilisateur assigné
 * @param {string} projectName - Nom du projet
 * @returns {Promise} - Promesse résolue avec les informations d'envoi ou rejetée avec une erreur
 */
const sendProjectAssignmentEmail = async (to, userName, projectName) => {
  const subject = `Vous avez été assigné au projet "${projectName}"`;

  const text = `Bonjour ${userName},

Vous avez été assigné au projet "${projectName}".

Vous pouvez maintenant accéder à ce projet depuis votre tableau de bord.

Cordialement,
L'équipe CodevisionPiweb`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #333;">Nouvelle assignation de projet</h2>
    <p>Bonjour <strong>${userName}</strong>,</p>
    <p>Vous avez été assigné au projet <strong>"${projectName}"</strong>.</p>
    <p>Vous pouvez maintenant accéder à ce projet depuis votre tableau de bord.</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="color: #666; font-size: 14px;">Cordialement,<br>L'équipe CodevisionPiweb</p>
    </div>
  </div>
  `;

  return sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendProjectAssignmentEmail
};
