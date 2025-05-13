// Mock implementation of @huggingface/inference
class HuggingFaceInference {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async imageToText(options) {
    console.log('Mock HuggingFace imageToText called with:', options);
    return {
      generated_text: 'This is a mock response from HuggingFace inference API'
    };
  }

  async objectDetection(options) {
    console.log('Mock HuggingFace objectDetection called with:', options);
    return [
      {
        label: 'person',
        score: 0.98,
        box: { xmin: 10, ymin: 10, xmax: 100, ymax: 200 }
      }
    ];
  }

  async imageToImage(options) {
    console.log('Mock HuggingFace imageToImage called with:', options);
    return {
      similarity: 0.85
    };
  }
}

module.exports = { HfInference: HuggingFaceInference };
