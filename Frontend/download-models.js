const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'public', 'models');

// Ensure the models directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`Created directory: ${modelsDir}`);
} else {
  // Clean the directory
  fs.readdirSync(modelsDir).forEach(file => {
    fs.unlinkSync(path.join(modelsDir, file));
    console.log(`Deleted file: ${file}`);
  });
}

// List of model files to download
const modelFiles = [
  // TinyFaceDetector model
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // FaceLandmark68 model
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // FaceRecognition model
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Base URL for the models
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

// Download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${filePath}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all model files
async function downloadAllModels() {
  console.log('Starting download of face-api.js models...');
  
  for (const file of modelFiles) {
    const url = baseUrl + file;
    const filePath = path.join(modelsDir, file);
    
    try {
      await downloadFile(url, filePath);
    } catch (error) {
      console.error(`Error downloading ${file}:`, error);
    }
  }
  
  console.log('All models downloaded successfully!');
}

// Run the download
downloadAllModels().catch(console.error);
