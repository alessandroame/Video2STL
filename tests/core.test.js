import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScanExecutionPlan } from '../src/core/scan-planner.js';
import { selectSharpestFrames } from '../src/core/frame-selector.js';
import { buildFusion360ExportPlan, computeMetricScaleFactorMm } from '../src/core/cad-export-planner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coreDir = path.resolve(__dirname, '../src/core');

describe('Shift-Left Architectural Governance (Headless Core)', () => {
  it('enforces zero DOM, storage, or process references inside src/core/', () => {
    const files = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js'));
    assert.ok(files.length >= 3, 'Expected at least 3 core modules');

    const forbiddenPatterns = [
      /\bwindow\b/,
      /\bdocument\b/,
      /\bHTMLElement\b/,
      /\bnavigator\b/,
      /\blocalStorage\b/,
      /\bchild_process\b/
    ];

    for (const file of files) {
      const content = fs.readFileSync(path.join(coreDir, file), 'utf8');
      for (const pattern of forbiddenPatterns) {
        assert.equal(
          pattern.test(content),
          false,
          `Forbidden non-headless token ${pattern} found in src/core/${file}`
        );
      }
    }
  });
});

describe('Scan Execution Planner (scan-planner.js)', () => {
  it('assigns preview-4gb profile on laptop RTX 500 Ada (4094 MiB)', () => {
    const plan = buildScanExecutionPlan({
      vramMiB: 4094,
      gpuCount: 1,
      videoDurationSec: 40,
      videoFps: 30,
      subjectType: 'object',
      sourceDevice: 'action-cam'
    });

    assert.equal(plan.tier, 'preview-4gb');
    assert.equal(plan.sourceDevice, 'action-cam');
    assert.equal(plan.maxResolutionPx, 1024);
    assert.equal(plan.targetFrameCount, 60);
    assert.equal(plan.trainingIterations, 7000);
    assert.equal(plan.angularStepDeg, 6);
  });

  it('assigns single-3090-24gb profile on desktop RTX 3090 (24576 MiB)', () => {
    const plan = buildScanExecutionPlan({
      vramMiB: 24576,
      gpuCount: 1,
      videoDurationSec: 60,
      videoFps: 30,
      subjectType: 'object'
    });

    assert.equal(plan.tier, 'single-3090-24gb');
    assert.equal(plan.maxResolutionPx, 2560);
    assert.equal(plan.targetFrameCount, 120);
    assert.equal(plan.trainingIterations, 30000);
    assert.equal(plan.recommendedPowerLimitW, 300);
    assert.equal(plan.angularStepDeg, 3);
  });

  it('assigns dual-3090-48gb profile with 240W power cap when second 3090 is mounted', () => {
    const plan = buildScanExecutionPlan({
      vramMiB: 24576,
      gpuCount: 2,
      videoDurationSec: 90,
      videoFps: 30,
      subjectType: 'room'
    });

    assert.equal(plan.tier, 'dual-3090-48gb');
    assert.equal(plan.totalVramMiB, 49152);
    assert.equal(plan.maxResolutionPx, 3840);
    assert.equal(plan.targetFrameCount, 220);
    assert.equal(plan.recommendedPowerLimitW, 240);
  });

  it('rejects invalid VRAM or ultra-short video clips', () => {
    assert.throws(() => buildScanExecutionPlan({ vramMiB: 0, videoDurationSec: 30 }), TypeError);
    assert.throws(() => buildScanExecutionPlan({ vramMiB: 24576, videoDurationSec: 3 }), RangeError);
  });
});

describe('Anti-Blur Frame Selector (frame-selector.js)', () => {
  it('picks the sharpest frame inside each temporal window and filters out motion blur', () => {
    const sampleFrames = [
      { frameIndex: 0, timestampSec: 0.0, sharpnessScore: 12.4 },
      { frameIndex: 1, timestampSec: 0.5, sharpnessScore: 84.2 },
      { frameIndex: 2, timestampSec: 1.0, sharpnessScore: 41.0 },
      { frameIndex: 3, timestampSec: 1.5, sharpnessScore: 92.5 },
      { frameIndex: 4, timestampSec: 2.0, sharpnessScore: 8.1 },
      { frameIndex: 5, timestampSec: 2.5, sharpnessScore: 9.4 }
    ];

    const result = selectSharpestFrames(sampleFrames, {
      targetCount: 3,
      minSharpnessThreshold: 20
    });

    assert.equal(result.selected.length, 2);
    assert.equal(result.selected[0].frameIndex, 1);
    assert.equal(result.selected[1].frameIndex, 3);
    assert.equal(result.rejectedBlurCount, 1);
    assert.equal(result.coverageRatio, 0.67);
  });
});

describe('Fusion 360 CAD Export & Metric Calibration Planner (cad-export-planner.js)', () => {
  it('computes exact millimeter scale factor from a 2-point reference measurement', () => {
    const factor = computeMetricScaleFactorMm({
      sceneDistanceUnits: 2.5,
      realWorldMm: 125
    });
    assert.equal(factor, 50);
  });

  it('decimates a 1.6M triangle dense scan to 10k faces for direct Fusion 360 B-Rep conversion', () => {
    const exportPlan = buildFusion360ExportPlan({
      workflow: 'brep-direct-convert',
      rawTriangleCount: 1600000,
      metricCalibration: {
        sceneDistanceUnits: 1.6,
        realWorldMm: 80
      }
    });

    assert.equal(exportPlan.targetFaceCount, 10000);
    assert.equal(exportPlan.decimationRatio, 0.0063);
    assert.equal(exportPlan.recommendedFormat, 'obj');
    assert.equal(exportPlan.unitSystem, 'mm');
    assert.equal(exportPlan.isMetricCalibrated, true);
    assert.equal(exportPlan.scaleFactorMm, 50);
  });
});
