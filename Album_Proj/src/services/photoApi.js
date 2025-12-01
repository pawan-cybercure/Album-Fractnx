import {API_BASE_URL} from '../config/api';
import {fetchPhotosFromDevice} from './mediaService';

const formatDateParam = (date) => {
  if (!date) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }
  return payload;
};

export const fetchPhotos = async (date) => {
  try {
    const dateParam = formatDateParam(date);
    const url = new URL(`${API_BASE_URL}/s3/photos`);
    if (dateParam) {
      url.searchParams.set('date', dateParam);
    }
    const response = await fetch(url.toString());
    const data = await handleResponse(response);
    return data.photos || [];
  } catch (err) {
    console.warn('Failed to fetch photos from backend, falling back to device CameraRoll', err);
    // Fallback to reading device gallery directly using CameraRoll
    try {
      const local = await fetchPhotosFromDevice(date);
      return local || [];
    } catch (err2) {
      console.warn('Failed to fetch photos from device', err2);
      return [];
    }
  }
};

export const uploadPhotoToApi = async ({uri, fileName, mimeType, selectedDate}) => {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: fileName || 'photo.jpg',
    type: mimeType || 'image/jpeg',
  });
  if (selectedDate) {
    formData.append('selectedDate', selectedDate);
  }
  const response = await fetch(`${API_BASE_URL}/s3/photos/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await handleResponse(response);
  return data.photo;
};
