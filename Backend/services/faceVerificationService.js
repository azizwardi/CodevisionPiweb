// Use mock for build process
let HfInference;
try {
  // Try to load the real module first
  ({ HfInference } = require('@huggingface/inference'));
} catch (error) {
  // Fall back to mock if the real module is not available
  console.log('Using mock HuggingFace inference module for build');
  ({ HfInference } = require('./mockHuggingface'));
}
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Vérifier si la clé API est définie
if (!process.env.HUGGING_FACE_API_KEY) {
  console.error('ERREUR: La clé API Hugging Face n\'est pas définie dans le fichier .env');
  console.error('Veuillez ajouter HUGGING_FACE_API_KEY=votre_clé_api dans le fichier .env');
}

// Initialiser le client Hugging Face
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// Modèle de détection faciale de Hugging Face
// Utiliser des modèles plus simples et plus fiables
const FACE_DETECTION_MODEL = "facebook/detr-resnet-50";
// Modèle alternatif si le premier ne fonctionne pas bien
// const FACE_DETECTION_MODEL = "Xenova/detr-resnet-50";

// Modèle de vérification faciale
const FACE_VERIFICATION_MODEL = "microsoft/florence-2-base";
// Modèle alternatif si le premier ne fonctionne pas bien
// const FACE_VERIFICATION_MODEL = "Xenova/face-verification";

// Répertoire pour stocker temporairement les images
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Service pour la vérification faciale
 */
class FaceVerificationService {
  /**
   * Détecte les visages dans une image
   * @param {string} base64Image - Image en base64
   * @returns {Promise<Array>} - Tableau des visages détectés
   */
  async detectFaces(base64Image) {
    try {
      // Convertir l'image base64 en buffer
      const imageBuffer = Buffer.from(base64Image, 'base64');

      // Sauvegarder temporairement l'image
      const imagePath = path.join(TEMP_DIR, `face_${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, imageBuffer);

      // Détecter les visages avec Hugging Face
      const result = await hf.objectDetection({
        model: FACE_DETECTION_MODEL,
        data: fs.readFileSync(imagePath),
      });

      // Supprimer le fichier temporaire
      fs.unlinkSync(imagePath);

      // Filtrer pour ne garder que les détections de visages
      const faces = result.filter(detection => detection.label === 'person');

      return faces;
    } catch (error) {
      console.error('Erreur lors de la détection des visages:', error);
      throw error;
    }
  }

  /**
   * Vérifie si deux visages appartiennent à la même personne
   * @param {string} referenceImage - Image de référence en base64
   * @param {string} verificationImage - Image à vérifier en base64
   * @returns {Promise<boolean>} - True si les visages correspondent
   */
  async verifyFaces(referenceImage, verificationImage) {
    try {
      // Convertir les images base64 en buffer
      const refImageBuffer = Buffer.from(referenceImage, 'base64');
      const verImageBuffer = Buffer.from(verificationImage, 'base64');

      // Sauvegarder temporairement les images
      const refImagePath = path.join(TEMP_DIR, `ref_${Date.now()}.jpg`);
      const verImagePath = path.join(TEMP_DIR, `ver_${Date.now()}.jpg`);

      fs.writeFileSync(refImagePath, refImageBuffer);
      fs.writeFileSync(verImagePath, verImageBuffer);

      // Utiliser le modèle de vérification faciale de Hugging Face
      const result = await hf.imageToImage({
        model: FACE_VERIFICATION_MODEL,
        inputs: {
          image1: fs.readFileSync(refImagePath),
          image2: fs.readFileSync(verImagePath)
        },
      });

      // Supprimer les fichiers temporaires
      fs.unlinkSync(refImagePath);
      fs.unlinkSync(verImagePath);

      // Analyser le résultat pour déterminer si les visages correspondent
      // Note: La logique exacte dépend du modèle utilisé
      const similarity = result.similarity || 0;

      // Seuil de similarité (à ajuster selon les besoins)
      const SIMILARITY_THRESHOLD = 0.7;

      return similarity >= SIMILARITY_THRESHOLD;
    } catch (error) {
      console.error('Erreur lors de la vérification des visages:', error);
      throw error;
    }
  }

  /**
   * Enregistre une image de référence pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} base64Image - Image en base64
   * @returns {Promise<boolean>} - True si l'enregistrement a réussi
   */
  async registerFace(userId, base64Image) {
    try {
      // Vérifier si l'image contient un visage
      const faces = await this.detectFaces(base64Image);

      if (faces.length === 0) {
        throw new Error('Aucun visage détecté dans l\'image');
      }

      if (faces.length > 1) {
        throw new Error('Plusieurs visages détectés dans l\'image');
      }

      // Créer le répertoire pour les images de référence s'il n'existe pas
      const userFacesDir = path.join(TEMP_DIR, 'user_faces');
      if (!fs.existsSync(userFacesDir)) {
        fs.mkdirSync(userFacesDir, { recursive: true });
      }

      // Sauvegarder l'image de référence
      const imagePath = path.join(userFacesDir, `${userId}.jpg`);
      fs.writeFileSync(imagePath, Buffer.from(base64Image, 'base64'));

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du visage:', error);
      throw error;
    }
  }

  /**
   * Vérifie l'identité d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} base64Image - Image en base64 à vérifier
   * @returns {Promise<boolean>} - True si l'identité est vérifiée
   */
  async verifyIdentity(userId, base64Image) {
    try {
      console.log(`Début de la vérification d'identité pour l'utilisateur ${userId}`);

      // Vérifier si l'image est valide
      if (!base64Image || typeof base64Image !== 'string') {
        console.error('Image invalide fournie pour la vérification');
        throw new Error('Image invalide fournie pour la vérification');
      }

      // Mode de test pour le développement
      if (process.env.FACE_VERIFICATION_TEST_MODE === 'true') {
        console.log('Mode test activé dans le service: vérification faciale automatiquement réussie');
        return true;
      }

      // Vérifier si l'image contient un visage
      console.log('Détection des visages dans l\'image...');
      const faces = await this.detectFaces(base64Image);

      console.log(`Nombre de visages détectés: ${faces.length}`);

      if (faces.length === 0) {
        throw new Error('Aucun visage détecté dans l\'image');
      }

      // Vérifier si l'utilisateur a une image de référence
      const userFacesDir = path.join(TEMP_DIR, 'user_faces');
      if (!fs.existsSync(userFacesDir)) {
        fs.mkdirSync(userFacesDir, { recursive: true });
      }

      const userFacePath = path.join(userFacesDir, `${userId}.jpg`);

      if (!fs.existsSync(userFacePath)) {
        // Si pas d'image de référence, enregistrer celle-ci
        console.log(`Aucune image de référence trouvée pour l'utilisateur ${userId}. Enregistrement de l'image actuelle comme référence.`);
        await this.registerFace(userId, base64Image);
        return true; // Premier enregistrement, on considère que c'est vérifié
      }

      // Lire l'image de référence
      console.log(`Image de référence trouvée pour l'utilisateur ${userId}. Comparaison des visages...`);
      const referenceImage = fs.readFileSync(userFacePath).toString('base64');

      // Vérifier si les visages correspondent
      const result = await this.verifyFaces(referenceImage, base64Image);
      console.log(`Résultat de la vérification: ${result ? 'Visages correspondent' : 'Visages ne correspondent pas'}`);

      return result;
    } catch (error) {
      console.error('Erreur détaillée lors de la vérification de l\'identité:', error);

      // Pour le développement, on peut retourner true même en cas d'erreur
      if (process.env.NODE_ENV === 'development') {
        console.log('Mode développement: retourne true malgré l\'erreur');
        return true;
      }

      throw error;
    }
  }
}

module.exports = new FaceVerificationService();
