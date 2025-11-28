import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {getExifForUri} from './metadataService';
import {saveMediaRecord} from '../storage/storage';

async function fetchBatch(after) {
  const result = await CameraRoll.getPhotos({
    first: 200,
    assetType: 'All',
    include: ['filename', 'fileSize', 'imageSize', 'playableDuration', 'location', 'creationDate', 'duration'],
    after: after || undefined
  });
  return {
    assets: result.edges.map(e => e.node),
    endCursor: result.page_info.end_cursor,
    hasNextPage: result.page_info.has_next_page
  };
}

function toMillis(value) {
  if (value == null) {
    return undefined;
  }
  // CameraRoll timestamp/creationTime can arrive as seconds or milliseconds depending on platform.
  return value < 1e12 ? value * 1000 : value;
}

function normalizeType(type) {
  if (type?.toLowerCase().includes('video')) {
    return 'video';
  }
  return 'image';
}

async function buildRecord(asset) {
  const {image} = asset;
  const mediaType = normalizeType(image.playableDuration ? 'video' : image.extension || image.type);
  const creationDate =
    toMillis(asset.timestamp) ??
    toMillis(asset.creationTime) ??
    Date.now();
  const exif = await getExifForUri(image.uri);
  const faces = []; // face detection disabled for frontend-only flow
  const s3Url = undefined; // uploads disabled for frontend-only flow

  return {
    id: asset.image.filename || asset.image.uri,
    uri: image.uri,
    filename: image.filename || image.uri.split('/').pop() || 'unknown',
    mediaType,
    creationDate,
    exif,
    faces,
    s3Url
  };
}

export async function ingestAllMedia(onProgress) {
  const collected = [];
  let hasNext = true;
  let cursor;
  let total = 0;
  // Fetch first pages only if needed; stop when no more pages.

  while (hasNext) {
    const {assets, hasNextPage, endCursor} = await fetchBatch(cursor);
    for (const asset of assets) {
      total += 1;
      try {
        const record = await buildRecord(asset);
        await saveMediaRecord(record);
        collected.push(record);
      } catch (err) {
        console.warn('Failed to process asset', asset.image.uri, err);
      } finally {
        onProgress?.(collected.length, total);
      }
    }
    cursor = endCursor || undefined;
    hasNext = hasNextPage;
  }

  return collected;
}
