import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import Button from '../ui/button/Button';
import { toastManager } from '../ui/toast/ToastContainer';

interface FaceVerificationProps {
  onVerificationComplete: (success: boolean) => void;
  userId: string;
  quizId: string;
}

const FaceVerification: React.FC<FaceVerificationProps> = ({ onVerificationComplete, userId, quizId }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);

  // Chargement des modèles face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Chemin vers les modèles
        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setIsModelLoaded(true);
        console.log('Modèles face-api.js chargés avec succès');
      } catch (error) {
        console.error('Erreur lors du chargement des modèles face-api.js:', error);
        toastManager.addToast({
          title: 'Erreur',
          description: 'Impossible de charger les modèles de détection faciale',
          type: 'error'
        });
      }
    };

    loadModels();
  }, []);

  // Fonction pour détecter les visages dans l'image capturée
  const detectFaces = async (imageElement: HTMLImageElement) => {
    if (!isModelLoaded || !canvasRef.current) return null;

    const detections = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      // Dessiner les résultats sur le canvas
      const canvas = canvasRef.current;
      const displaySize = { width: imageElement.width, height: imageElement.height };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Effacer le canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dessiner le cadre de détection et les points de repère
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

      setFaceDetected(true);
      return detections.descriptor;
    } else {
      setFaceDetected(false);
      return null;
    }
  };

  // Fonction pour capturer une image de la webcam
  const captureImage = async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);

        // Créer un élément image pour l'analyse
        const img = new Image();
        img.src = imageSrc;

        img.onload = async () => {
          const descriptor = await detectFaces(img);
          if (descriptor) {
            setFaceDescriptor(descriptor);
          } else {
            toastManager.addToast({
              title: 'Avertissement',
              description: 'Aucun visage détecté. Veuillez réessayer.',
              type: 'warning'
            });
          }
          setIsCapturing(false);
        };
      }
    } catch (error) {
      console.error('Erreur lors de la capture d\'image:', error);
      setIsCapturing(false);
      toastManager.addToast({
        title: 'Erreur',
        description: 'Impossible de capturer l\'image',
        type: 'error'
      });
    }
  };

  // Fonction pour vérifier l'identité avec Hugging Face
  const verifyIdentity = async () => {
    if (!faceDescriptor || !capturedImage) {
      toastManager.addToast({
        title: 'Erreur',
        description: 'Veuillez d\'abord capturer une image avec un visage détecté',
        type: 'error'
      });
      return;
    }

    setVerifying(true);

    try {
      console.log('Début de la vérification faciale...');
      console.log('UserId:', userId);
      console.log('QuizId:', quizId);

      // Convertir l'image en base64 (enlever le préfixe data:image/jpeg;base64,)
      const base64Image = capturedImage.split(',')[1];

      // Vérifier que l'image est bien convertie
      if (!base64Image) {
        throw new Error('Échec de la conversion de l\'image en base64');
      }

      console.log('Image convertie en base64 avec succès');

      // Envoyer l'image au backend pour vérification avec Hugging Face
      console.log('Envoi de la requête au serveur...');
      const response = await axios.post('http://localhost:5000/face-verification/verify', {
        userId,
        quizId,
        faceImage: base64Image,
        faceDescriptor: Array.from(faceDescriptor) // Convertir Float32Array en array normal
      });

      console.log('Réponse du serveur:', response.data);

      if (response.data.verified) {
        console.log('Vérification faciale réussie');
        toastManager.addToast({
          title: 'Succès',
          description: 'Vérification faciale réussie',
          type: 'success'
        });
        onVerificationComplete(true);
      } else {
        console.log('Vérification faciale échouée');
        toastManager.addToast({
          title: 'Échec',
          description: 'La vérification faciale a échoué. Veuillez réessayer.',
          type: 'error'
        });
        onVerificationComplete(false);
      }
    } catch (error: any) {
      console.error('Erreur détaillée lors de la vérification faciale:', error);

      // Extraire le message d'erreur du serveur si disponible
      let errorMessage = 'Erreur lors de la vérification faciale';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error('Message d\'erreur du serveur:', errorMessage);
      }

      toastManager.addToast({
        title: 'Erreur',
        description: errorMessage,
        type: 'error'
      });

      // En mode développement, on peut simuler une vérification réussie malgré l'erreur
      // Décommentez la ligne suivante pour tester le flux sans vérification réelle
      // onVerificationComplete(true);

      onVerificationComplete(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-4">Vérification faciale</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Pour des raisons de sécurité, veuillez vérifier votre identité avant de commencer le quiz.
      </p>

      <div className="relative w-full max-w-md mb-4">
        {!capturedImage ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
          />
        ) : (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        {!capturedImage ? (
          <Button
            variant="primary"
            onClick={captureImage}
            disabled={!isModelLoaded || isCapturing}
          >
            {isCapturing ? 'Capture en cours...' : 'Capturer'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null);
                setFaceDetected(false);
                setFaceDescriptor(null);
              }}
            >
              Reprendre
            </Button>
            <Button
              variant="primary"
              onClick={verifyIdentity}
              disabled={!faceDetected || verifying}
            >
              {verifying ? 'Vérification...' : 'Vérifier l\'identité'}
            </Button>
          </>
        )}
      </div>

      {!isModelLoaded && (
        <p className="text-yellow-500">
          Chargement des modèles de détection faciale...
        </p>
      )}
    </div>
  );
};

export default FaceVerification;
