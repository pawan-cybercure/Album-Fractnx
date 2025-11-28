import FaceDetector from '@react-native-ml-kit/face-detection';

const options = {
  performanceMode: 'fast',
  contourMode: 'none',
  classificationMode: 'all'
};

export async function detectFaces(uri: string) {
  try {
    // Some devices/installs may not have native ML Kit properly linked; guard against missing method.
    if (!FaceDetector || typeof FaceDetector.detectFromUri !== 'function') {
      return [];
    }
    const faces = await FaceDetector.detectFromUri(uri, options);
    return faces.map(face => ({
      id: face.trackingId?.toString() || Math.random().toString(36).slice(2),
      mediaId: uri,
      bounds: face.bounds
    }));
  } catch (err) {
    console.warn('Face detection failed', uri, err);
    return [];
  }
}
