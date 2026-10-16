/**
 * Pure headless CAD export & mesh decimation planner for Autodesk Fusion 360 workflows.
 * Converts scale-ambiguous photogrammetric reconstructions into millimeter-calibrated,
 * decimated surface meshes (.obj, .stl, .3mf) tailored to Fusion 360's B-Rep and Section Sketch limits.
 */

const FUSION360_WORKFLOW_PROFILES = {
  'brep-direct-convert': {
    targetFaceCount: 10000,
    maxSafeFaceCount: 25000,
    recommendedFormat: 'obj',
    reconstructionBackend: 'colmap-openmvs-poisson',
    remeshTopology: 'quad-dominant',
    fusionMethod: 'Mesh > Modify > Convert Mesh (Faceted / Prismatic)'
  },
  'reverse-engineering-sketch': {
    targetFaceCount: 80000,
    maxSafeFaceCount: 150000,
    recommendedFormat: 'stl',
    reconstructionBackend: '2dgs-tsdf-mesh',
    remeshTopology: 'isotropic-triangles',
    fusionMethod: 'Mesh > Create > Create Mesh Section Sketch > Fit Curves to Mesh Section'
  },
  'visual-reference-only': {
    targetFaceCount: 250000,
    maxSafeFaceCount: 500000,
    recommendedFormat: 'obj',
    reconstructionBackend: '2dgs-tsdf-mesh',
    remeshTopology: 'raw-decimated',
    fusionMethod: 'Insert > Insert Mesh (Reference Body)'
  }
};

/**
 * Computes the metric scale factor (in millimeters per scene unit) from a two-point reference measurement.
 *
 * @param {Object} calibration
 * @param {number} calibration.sceneDistanceUnits - Measured distance between two points in raw 3D scene units.
 * @param {number} calibration.realWorldMm - Known physical distance between those two points in millimeters.
 * @returns {number} Scale multiplier to transform the mesh into exact millimeters for Fusion 360.
 */
export function computeMetricScaleFactorMm(calibration) {
  if (!calibration || typeof calibration.sceneDistanceUnits !== 'number' || calibration.sceneDistanceUnits <= 0) {
    throw new RangeError('sceneDistanceUnits must be a positive number');
  }
  if (typeof calibration.realWorldMm !== 'number' || calibration.realWorldMm <= 0) {
    throw new RangeError('realWorldMm must be a positive number in millimeters');
  }

  return Number((calibration.realWorldMm / calibration.sceneDistanceUnits).toFixed(6));
}

/**
 * Builds a CAD export specification compatible with Autodesk Fusion 360.
 *
 * @param {Object} options
 * @param {'brep-direct-convert'|'reverse-engineering-sketch'|'visual-reference-only'} [options.workflow='reverse-engineering-sketch']
 * @param {number} options.rawTriangleCount - Initial dense mesh triangle count from GPU reconstruction.
 * @param {{sceneDistanceUnits: number, realWorldMm: number}} [options.metricCalibration] - Optional 2-point scale reference.
 * @returns {Object} Complete export plan including decimation ratio, format, units, and Fusion 360 import steps.
 */
export function buildFusion360ExportPlan(options) {
  if (!options || typeof options.rawTriangleCount !== 'number' || options.rawTriangleCount < 100) {
    throw new RangeError('rawTriangleCount must be a number >= 100');
  }

  const workflowKey = options.workflow || 'reverse-engineering-sketch';
  const profile = FUSION360_WORKFLOW_PROFILES[workflowKey];
  if (!profile) {
    throw new TypeError(`Unsupported Fusion 360 workflow: ${workflowKey}`);
  }

  const targetFaces = Math.min(options.rawTriangleCount, profile.targetFaceCount);
  const decimationRatio = Number((targetFaces / options.rawTriangleCount).toFixed(4));
  const scaleFactorMm = options.metricCalibration
    ? computeMetricScaleFactorMm(options.metricCalibration)
    : 1.0;

  return {
    workflow: workflowKey,
    outputFormats: ['stl', 'obj', '3mf'],
    recommendedFormat: profile.recommendedFormat,
    reconstructionBackend: profile.reconstructionBackend,
    remeshTopology: profile.remeshTopology,
    rawTriangleCount: options.rawTriangleCount,
    targetFaceCount: targetFaces,
    maxSafeFaceCount: profile.maxSafeFaceCount,
    decimationRatio,
    unitSystem: 'mm',
    isMetricCalibrated: Boolean(options.metricCalibration),
    scaleFactorMm,
    fusionImportGuide: profile.fusionMethod
  };
}
