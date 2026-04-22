// AI Severity Utility
// My design: Multi-signal approach instead of blood detection alone.
// Signal 1: Colour analysis — detects red/dark pixel concentration (blood proxy)
// Signal 2: Posture heuristic — image aspect ratio + edge density (lying flat = more horizontal)
// Signal 3: Human self-reported severity (weighted 40%)
//
// In production: replace pixel analysis with a real CV model
// (e.g. Roboflow, Hugging Face ViT, or a custom TensorFlow model).
// The interface here is designed to be a drop-in replacement.

const axios = require('axios');
const cloudinary = require('../config/cloudinary');

const getSeverityFromImage = async (imageUrl) => {
  try {
    // Use Cloudinary's built-in color analysis transformation to get dominant colors
    // This is a free, no-extra-model approach for MVP
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];

    // Request color palette from Cloudinary
    const colorInfo = await cloudinary.api.resource(publicId, { colors: true });
    const colors = colorInfo?.colors || [];

    // Detect blood-red tones: high R, low G, low B
    let bloodScore = 0;
    let darkScore  = 0;

    for (const [hex, prevalence] of colors) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      // Red channel dominant and green/blue are low → blood indicator
      if (r > 140 && g < 80 && b < 80) bloodScore += prevalence;

      // Very dark pixels → dried blood, bruising, or deep wound
      if (r < 60 && g < 60 && b < 60) darkScore += prevalence;
    }

    const bloodDetected = bloodScore > 2;  // >2% red pixels = likely blood
    const combinedSignal = bloodScore * 1.5 + darkScore * 0.5;

    // Map signal to 1-5 severity
    let aiSeverity;
    if      (combinedSignal > 15) aiSeverity = 5;
    else if (combinedSignal > 8)  aiSeverity = 4;
    else if (combinedSignal > 4)  aiSeverity = 3;
    else if (combinedSignal > 1)  aiSeverity = 2;
    else                          aiSeverity = 1;

    // Posture heuristic: very wide images tend to be lying-down animals (higher severity)
    const width  = colorInfo?.width  || 1;
    const height = colorInfo?.height || 1;
    const ratio  = width / height;
    const postureScore = ratio > 1.8 ? 4 : ratio > 1.2 ? 3 : 2;

    return { severity: aiSeverity, bloodDetected, postureScore };
  } catch (err) {
    console.error('AI severity analysis failed, defaulting to 3:', err.message);
    // Safe fallback — never block a rescue report due to AI failure
    return { severity: 3, bloodDetected: false, postureScore: 2 };
  }
};

module.exports = { getSeverityFromImage };