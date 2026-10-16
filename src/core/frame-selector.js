/**
 * Pure headless anti-blur frame selector.
 * Partitions a video timeline into uniform angular intervals and selects the sharpest frame
 * per interval using Laplacian variance scores to prevent floating artifacts in 3D reconstruction.
 */

/**
 * Selects the sharpest frames across uniform temporal windows.
 *
 * @param {Array<{frameIndex: number, timestampSec: number, sharpnessScore: number}>} frames
 * @param {Object} options
 * @param {number} options.targetCount - Desired number of output frames.
 * @param {number} [options.minSharpnessThreshold=15] - Minimum acceptable Laplacian variance score.
 * @returns {{selected: Array<Object>, rejectedBlurCount: number, coverageRatio: number}}
 */
export function selectSharpestFrames(frames, options) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new TypeError('frames must be a non-empty array');
  }
  if (!options || typeof options.targetCount !== 'number' || options.targetCount < 1) {
    throw new RangeError('options.targetCount must be a positive integer');
  }

  const minThreshold = typeof options.minSharpnessThreshold === 'number' ? options.minSharpnessThreshold : 15;
  const bucketCount = Math.min(frames.length, Math.floor(options.targetCount));
  const bucketSize = frames.length / bucketCount;

  const selected = [];
  let rejectedBlurCount = 0;

  for (let b = 0; b < bucketCount; b += 1) {
    const startIdx = Math.floor(b * bucketSize);
    const endIdx = Math.min(frames.length, Math.floor((b + 1) * bucketSize));
    let bestFrame = null;

    for (let i = startIdx; i < endIdx; i += 1) {
      const candidate = frames[i];
      if (!bestFrame || candidate.sharpnessScore > bestFrame.sharpnessScore) {
        bestFrame = candidate;
      }
    }

    if (bestFrame) {
      if (bestFrame.sharpnessScore >= minThreshold) {
        selected.push(bestFrame);
      } else {
        rejectedBlurCount += 1;
      }
    }
  }

  return {
    selected,
    rejectedBlurCount,
    coverageRatio: Number((selected.length / bucketCount).toFixed(2))
  };
}
