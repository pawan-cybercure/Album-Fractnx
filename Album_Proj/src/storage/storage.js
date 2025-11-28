import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV();

// ---------- helpers ----------
const getJSON = (key) => {
  const value = storage.getString(key);
  return value ? JSON.parse(value) : null;
};

const setJSON = (key, value) => {
  storage.set(key, JSON.stringify(value));
};

/**
 * Keys we'll use
 */
const MEDIA_KEY = 'MEDIA_RECORDS';
const FACE_KEY = 'FACE_RECORDS';

// ---------- serializers ----------

/**
 * Convert full MediaRecord-like object to storage object
 */
function serializeMedia(record) {
  return {
    ...record,
    exif: record.exif ? JSON.stringify(record.exif) : null,
    faces: (record.faces || []).map(f => ({
      id: f.id,
      mediaId: f.mediaId,
      x: f.bounds?.x ?? null,
      y: f.bounds?.y ?? null,
      width: f.bounds?.width ?? null,
      height: f.bounds?.height ?? null
    }))
  };
}

/**
 * Convert stored object back to MediaRecord shape
 */
function deserializeMedia(item) {
  return {
    id: item.id,
    uri: item.uri,
    filename: item.filename,
    mediaType: item.mediaType,
    creationDate: item.creationDate,
    s3Url: item.s3Url ?? undefined,
    exif: item.exif ? JSON.parse(item.exif) : undefined,
    faces: item.faces?.map((f) => ({
      id: f.id,
      mediaId: f.mediaId,
      bounds:
        f.x != null
          ? {x: f.x, y: f.y, width: f.width, height: f.height}
          : undefined
    }))
  };
}

// ---------- core API ----------

function readMediaList() {
  const raw = getJSON(MEDIA_KEY) ?? [];
  return raw.map(deserializeMedia);
}

function readFaceList() {
  const raw = getJSON(FACE_KEY) ?? [];
  return raw.map((f) => ({
    id: f.id,
    mediaId: f.mediaId,
    bounds:
      f.x != null
        ? {
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height
          }
        : undefined
  }));
}

function persist(media, faces) {
  setJSON(MEDIA_KEY, media.map(serializeMedia));
  setJSON(
    FACE_KEY,
    faces.map((f) => ({
      id: f.id,
      mediaId: f.mediaId,
      x: f.bounds?.x ?? null,
      y: f.bounds?.y ?? null,
      width: f.bounds?.width ?? null,
      height: f.bounds?.height ?? null
    }))
  );
}

export async function saveMediaRecord(record) {
  const currentMedia = readMediaList();
  const currentFaces = readFaceList();

  const idx = currentMedia.findIndex((m) => m.id === record.id);
  if (idx >= 0) {
    currentMedia[idx] = record;
  } else {
    currentMedia.push(record);
  }

  const newFaces = record.faces || [];
  const mergedFacesMap = new Map();
  [...currentFaces, ...newFaces].forEach((f) => mergedFacesMap.set(f.id, f));

  persist(currentMedia, Array.from(mergedFacesMap.values()));
}

function sortByNewest(list) {
  return [...list].sort((a, b) => b.creationDate - a.creationDate);
}

// Handle data that may have been stored with an accidental ms*1000 multiplication.
function normalizeStoredDate(value) {
  if (!value) {
    return value;
  }
  // If the value looks excessively large (likely double-multiplied), bring it back down.
  return value > 2e13 ? Math.floor(value / 1000) : value;
}

export function filterMediaByDate(list, date) {
  if (!date) {
    return sortByNewest(list.map(m => ({...m, creationDate: normalizeStoredDate(m.creationDate)})));
  }
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  return sortByNewest(
    list
      .map(m => ({...m, creationDate: normalizeStoredDate(m.creationDate)}))
      .filter((m) => m.creationDate >= dayStart.getTime() && m.creationDate <= dayEnd.getTime())
  );
}

export async function getAllMedia() {
  return sortByNewest(readMediaList());
}

export async function getMediaByDate(date) {
  const all = readMediaList();
  return filterMediaByDate(all, date);
}

export async function getAllFaces() {
  return readFaceList();
}

export async function getMediaByFaceId(faceId) {
  const all = readMediaList();
  return all.filter((m) => m.faces?.some((f) => f.id === faceId));
}
