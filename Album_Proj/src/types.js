/**
 * Shape documentation for the media records used throughout the app.
 * These typedefs keep IDE hints while running plain JavaScript.
 */

/**
 * @typedef {'image' | 'video'} MediaType
 */

/**
 * @typedef {Object} FaceTag
 * @property {string} id
 * @property {string} mediaId
 * @property {{x: number, y: number, width: number, height: number}=} bounds
 */

/**
 * @typedef {Object} MediaRecord
 * @property {string} id
 * @property {string} uri
 * @property {string} filename
 * @property {MediaType} mediaType
 * @property {number} creationDate
 * @property {string=} s3Url
 * @property {Object.<string, any>=} exif
 * @property {FaceTag[]=} faces
 */

export const shapeDocs = {};
