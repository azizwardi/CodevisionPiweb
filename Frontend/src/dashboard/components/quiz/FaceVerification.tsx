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

  // Loading face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Path to models
        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        setIsModelLoaded(true);
        console.log('Face-api.js models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        toastManager.addToast({
          title: 'Error',
          description: 'Unable to load facial detection models',
          type: 'error'
        });
      }
    };

    loadModels();
  }, []);

  // Function to detect faces in the captured image
  const detectFaces = async (imageElement: HTMLImageElement) => {
    if (!isModelLoaded || !canvasRef.current) return null;

    const detections = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      // Draw results on canvas
      const canvas = canvasRef.current;
      const displaySize = { width: imageElement.width, height: imageElement.height };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detection box and landmarks
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

  // Function to capture an image from the webcam
  const captureImage = async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);

        // Create an image element for analysis
        const img = new Image();
        img.src = imageSrc;

        img.onload = async () => {
          const descriptor = await detectFaces(img);
          if (descriptor) {
            setFaceDescriptor(descriptor);
          } else {
            toastManager.addToast({
              title: 'Warning',
              description: 'No face detected. Please try again.',
              type: 'warning'
            });
          }
          setIsCapturing(false);
        };
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      setIsCapturing(false);
      toastManager.addToast({
        title: 'Error',
        description: 'Unable to capture image',
        type: 'error'
      });
    }
  };

  // Function to verify identity with Hugging Face
  const verifyIdentity = async () => {
    if (!faceDescriptor || !capturedImage) {
      toastManager.addToast({
        title: 'Error',
        description: 'Please capture an image with a detected face first',
        type: 'error'
      });
      return;
    }

    setVerifying(true);

    try {
      console.log('Starting facial verification...');
      console.log('UserId:', userId);
      console.log('QuizId:', quizId);

      // Convert image to base64 (remove the prefix data:image/jpeg;base64,)
      const base64Image = capturedImage.split(',')[1];

      // Verify that the image is properly converted
      if (!base64Image) {
        throw new Error('Failed to convert image to base64');
      }

      console.log('Image successfully converted to base64');

      // Send the image to the backend for verification with Hugging Face
      console.log('Sending request to server...');
      const response = await axios.post('http://localhost:5000/face-verification/verify', {
        userId,
        quizId,
        faceImage: base64Image,
        faceDescriptor: Array.from(faceDescriptor) // Convert Float32Array to normal array
      });

      console.log('Server response:', response.data);

      if (response.data.verified) {
        console.log('Facial verification successful');
        toastManager.addToast({
          title: 'Success',
          description: 'Facial verification successful',
          type: 'success'
        });
        onVerificationComplete(true);
      } else {
        console.log('Facial verification failed');
        toastManager.addToast({
          title: 'Failed',
          description: 'Facial verification failed. Please try again.',
          type: 'error'
        });
        onVerificationComplete(false);
      }
    } catch (error: any) {
      console.error('Detailed error during facial verification:', error);

      // Extract error message from server if available
      let errorMessage = 'Error during facial verification';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.error('Server error message:', errorMessage);
      }

      toastManager.addToast({
        title: 'Error',
        description: errorMessage,
        type: 'error'
      });

      // In development mode, we can simulate a successful verification despite the error
      // Uncomment the following line to test the flow without actual verification
      // onVerificationComplete(true);

      onVerificationComplete(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-4">Facial verification</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        For security reasons, please verify your identity before starting the quiz.
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
              To resume
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
          Loading face detection models...
        </p>
      )}
    </div>
  );
};

export default FaceVerification;
