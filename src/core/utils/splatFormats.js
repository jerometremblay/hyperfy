/**
 * Shared utilities for Gaussian Splat format detection
 */

// Supported splat file formats
export const SPLAT_FORMATS = {
  PLY: 'ply',
  SPLAT: 'splat',
  KSPLAT: 'ksplat',
  SPZ: 'spz',
  SOG: 'sog',
  SOGS: 'sogs',
  SOGSZIP: 'sogszip',
  ZIP: 'zip'
}

// Array of supported extensions for easy iteration
export const SPLAT_EXTENSIONS = Object.values(SPLAT_FORMATS)

/**
 * Detect splat format from filename or URL
 * @param {string} filename - The filename or URL to detect format from
 * @returns {string|null} - The detected format or null if not supported
 */
export function detectSplatFormat(filename) {
  if (!filename || typeof filename !== 'string') {
    return null
  }

  const ext = filename.toLowerCase().split('.').pop()
  
  // Check if extension matches any supported format
  if (SPLAT_EXTENSIONS.includes(ext)) {
    return ext
  }

  // Special handling for compressed formats
  if (ext === 'gz' && filename.toLowerCase().includes('.spz')) {
    return 'spz'
  }
  
  if (ext === 'zip' && filename.toLowerCase().includes('.sog')) {
    return 'sogszip'
  }

  return null
}

/**
 * Detect a file type accepted by the builder's drag-and-drop handler.
 *
 * Hyperfy apps and regular models share the same drop target as splat files,
 * but are not splat formats themselves.
 */
export function detectBuilderFileType(filename) {
  if (!filename || typeof filename !== 'string') {
    return null
  }

  const ext = filename.toLowerCase().split('.').pop()
  if (['hyp', 'glb', 'vrm'].includes(ext)) {
    return ext
  }

  return detectSplatFormat(filename)
}

/**
 * Check if a file is a supported splat format
 * @param {string} filename - The filename or URL to check
 * @returns {boolean} - True if the format is supported
 */
export function isSupportedSplatFormat(filename) {
  return detectSplatFormat(filename) !== null
}

/**
 * Get the Spark.js compatible file type for a given extension
 * @param {string} ext - File extension
 * @returns {string} - Spark.js compatible file type
 */
export function getSparkFileType(ext) {
  const format = ext?.toLowerCase()
  
  switch (format) {
    // Spark 2.0: ksplat is now native, no mapping needed
    case 'sog':
    case 'sogs':
    case 'zip':
      return 'pcsogs' // Spark.js uses pcsogs for these formats
    case 'sogszip':
      return 'pcsogszip'
    default:
      return format // Use the extension as-is for most formats
  }
}
