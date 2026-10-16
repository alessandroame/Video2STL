/**
 * Pure headless planner for 3D photogrammetry and Gaussian Splatting pipelines.
 * Computes optimal frame count, resolution, training iterations, and GPU power ceilings
 * based on detected VRAM and video capture parameters.
 */

/**
 * Computes an execution profile given hardware capabilities and video metadata.
 *
 * @param {Object} input
 * @param {number} input.vramMiB - Available GPU memory in MiB (e.g., 4094 for RTX 500 Ada, 24576 for RTX 3090).
 * @param {number} [input.gpuCount=1] - Number of active GPUs.
 * @param {number} input.videoDurationSec - Duration of the captured smartphone video in seconds.
 * @param {number} [input.videoFps=30] - Frame rate of the input video.
 * @param {'object'|'room'|'mechanical-part'} [input.subjectType='object'] - Type of physical subject being scanned.
 * @returns {Object} Validated execution plan with hardware profile, frame extraction targets, and training parameters.
 */
export function buildScanExecutionPlan(input) {
  if (!input || typeof input.vramMiB !== 'number' || input.vramMiB <= 0) {
    throw new TypeError('vramMiB must be a positive number');
  }
  if (typeof input.videoDurationSec !== 'number' || input.videoDurationSec < 5) {
    throw new RangeError('videoDurationSec must be at least 5 seconds for multi-view stereo overlap');
  }

  const gpuCount = typeof input.gpuCount === 'number' && input.gpuCount >= 1 ? Math.floor(input.gpuCount) : 1;
  const videoFps = typeof input.videoFps === 'number' && input.videoFps > 0 ? input.videoFps : 30;
  const subjectType = input.subjectType || 'object';
  const sourceDevice = input.sourceDevice || 'generic-video';
  const totalVramMiB = input.vramMiB * gpuCount;

  let tier = 'preview-4gb';
  let maxResolutionPx = 1024;
  let maxTargetFrames = 60;
  let trainingIterations = 7000;
  let recommendedPowerLimitW = null;

  if (totalVramMiB >= 40000 && gpuCount >= 2) {
    tier = 'dual-3090-48gb';
    maxResolutionPx = 3840;
    maxTargetFrames = 320;
    trainingIterations = 30000;
    recommendedPowerLimitW = 240;
  } else if (totalVramMiB >= 20000) {
    tier = 'single-3090-24gb';
    maxResolutionPx = 2560;
    maxTargetFrames = 180;
    trainingIterations = 30000;
    recommendedPowerLimitW = 300;
  } else if (totalVramMiB >= 8000) {
    tier = 'midrange-8gb';
    maxResolutionPx = 1600;
    maxTargetFrames = 100;
    trainingIterations = 15000;
  }

  const baseFramesBySubject = {
    'mechanical-part': 90,
    'object': 120,
    'room': 220
  };
  const idealFrames = baseFramesBySubject[subjectType] ?? 120;
  const totalRawFrames = Math.floor(input.videoDurationSec * videoFps);
  const targetFrameCount = Math.min(maxTargetFrames, idealFrames, Math.max(20, Math.floor(totalRawFrames / 4)));
  const windowSizeFrames = Math.max(1, Math.floor(totalRawFrames / targetFrameCount));

  const estimatedMinutes = tier === 'preview-4gb'
    ? 6
    : tier === 'single-3090-24gb'
      ? 8
      : 6;

  return {
    tier,
    sourceDevice,
    gpuCount,
    totalVramMiB,
    maxResolutionPx,
    totalRawFrames,
    targetFrameCount,
    windowSizeFrames,
    trainingIterations,
    recommendedPowerLimitW,
    estimatedMinutes,
    angularStepDeg: Number((360 / targetFrameCount).toFixed(1))
  };
}
