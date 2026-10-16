import { execFileSync } from 'node:child_process';
import { buildScanExecutionPlan } from '../core/scan-planner.js';

setTimeout(() => {
  console.error('[FATAL TIMEOUT] Hardware probe exceeded 45 seconds.');
  process.exit(1);
}, 45000).unref();

function queryLocalGpu() {
  try {
    const raw = execFileSync(
      'nvidia-smi',
      ['--query-gpu=name,memory.total,driver_version', '--format=csv,noheader,nounits'],
      { encoding: 'utf8', timeout: 8000 }
    ).trim();

    const lines = raw.split(/\r?\n/).filter(Boolean);
    const gpus = lines.map((line) => {
      const [name, memoryMiB, driver] = line.split(',').map((s) => s.trim());
      return {
        name,
        vramMiB: Number(memoryMiB),
        driver
      };
    });
    return gpus;
  } catch {
    return [];
  }
}

const detectedGpus = queryLocalGpu();
const primaryVram = detectedGpus[0]?.vramMiB ?? 4094;
const localPlan = buildScanExecutionPlan({
  vramMiB: primaryVram,
  gpuCount: detectedGpus.length || 1,
  videoDurationSec: 45,
  videoFps: 30,
  subjectType: 'object'
});

const desktop3090Plan = buildScanExecutionPlan({
  vramMiB: 24576,
  gpuCount: 1,
  videoDurationSec: 45,
  videoFps: 30,
  subjectType: 'object'
});

console.log(JSON.stringify({
  detectedHostGpus: detectedGpus,
  localExecutionProfile: localPlan,
  targetDesktop3090Profile: desktop3090Plan
}, null, 2));
