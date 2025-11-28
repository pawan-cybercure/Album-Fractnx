import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {filterMediaByDate} from '../storage/storage';
import {fetchPhotos} from '../services/photoApi';

const MediaContext = createContext(undefined);

export const MediaProvider = ({children}) => {
  const [allMedia, setAllMedia] = useState([]);
  const [media, setMedia] = useState([]);
  const [faces, setFaces] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState();

  const loadForDate = useCallback(
    (date, source) => {
      const base = source ?? allMedia;
      const items = filterMediaByDate(base, date ?? null);
      setMedia(items);
    },
    [allMedia]
  );

  const refresh = useCallback(
    async (dateOverride) => {
      setLoading(true);
      try {
        setProgress({current: 0, total: 0});
        const photos = await fetchPhotos(dateOverride);
        const normalized = photos.map((p) => {
          const tsCandidate =
            (p.selectedDate && new Date(p.selectedDate).getTime()) ||
            Number(p.timestamp) ||
            (p.createdAt ? new Date(p.createdAt).getTime() : Date.now());
          const ts = Number.isNaN(tsCandidate) ? Date.now() : tsCandidate;
          return {
            id: p.id || p.key || p.url,
            uri: p.url,
            url: p.url,
            filename: p.fileName || p.filename || 'photo',
            mediaType: 'image',
            creationDate: ts,
            s3Url: p.url,
            faces: [],
          };
        });
        const targetDate = dateOverride !== undefined ? dateOverride : selectedDate;
        setAllMedia(normalized);
        loadForDate(targetDate ?? null, normalized);
        setFaces([]); // Placeholder until backend face data exists
      } catch (err) {
        console.warn('Failed to fetch photos', err);
      } finally {
        setLoading(false);
        setProgress(undefined);
      }
      return true;
    },
    [selectedDate, loadForDate],
  );

  const filterByFace = useCallback(async (faceId) => {
    if (!faceId) {
      loadForDate(selectedDate);
      return;
    }
    const items = allMedia.filter(m => m.faces?.some(f => f.id === faceId));
    setMedia(filterMediaByDate(items, null));
  }, [allMedia, selectedDate, loadForDate]);

  useEffect(() => {
    loadForDate(selectedDate);
  }, [selectedDate, loadForDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => (
    {media, allMedia, faces, selectedDate, loading, progress, refresh, setSelectedDate, filterByFace}
  ), [media, allMedia, faces, selectedDate, loading, progress, refresh, filterByFace]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};

export function useMediaContext() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    throw new Error('useMediaContext must be inside MediaProvider');
  }
  return ctx;
}
