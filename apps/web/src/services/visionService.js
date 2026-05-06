import { analyzeVisionLive, saveFacialLog } from './api';

export async function postLiveFrame(base64Frame) {
  // Call real API endpoint
  const res = await analyzeVisionLive(base64Frame);
  // Persist facial log via API if available
  try {
    await saveFacialLog({
      timestamp: res.timestamp || new Date().toISOString(),
      predicted_emotion: res.predicted_emotion || res.emotion || 'neutral',
      confidence_score: res.confidence_score || res.confidence || 0.0,
      recommended_action_taken: null,
    });
  } catch (e) {
    // Non-blocking: log and continue
    console.warn('Failed to persist facial log:', e);
  }
  return res;
}
