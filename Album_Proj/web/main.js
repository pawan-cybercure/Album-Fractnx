import React, {useEffect, useMemo, useRef, useState} from 'https://esm.sh/react@18.2.0';
import {createRoot} from 'https://esm.sh/react-dom@18.2.0/client';
import * as faceapi from 'https://esm.sh/face-api.js@0.22.2';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models';

// Simple IndexedDB helpers for caching faces and media metadata
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('photo-face-cache', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('faces')) {
        db.createObjectStore('faces', {keyPath: 'photoId'});
      }
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', {keyPath: 'id'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function cacheItem(store, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readItem(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function App() {
  const [token, setToken] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [activeFaceId, setActiveFaceId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Sign in to start');

  // Load Google Identity Services script
  useEffect(() => {
    const existing = document.querySelector('script[data-googleapis]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleapis = 'true';
    document.body.appendChild(script);
  }, []);

  // Load face-api models lazily
  const loadFaceModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
    ]);
  };

  const handleLogin = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      alert('Add your Google OAuth Client ID in web/main.js before logging in.');
      return;
    }
    /* global google */
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: PHOTOS_SCOPE,
      callback: async (resp) => {
        if (resp.error) {
          setStatus('Login failed');
          return;
        }
        setToken(resp.access_token);
        setStatus('Fetching photos...');
        await fetchPhotos(resp.access_token);
      },
    });
    client.requestAccessToken();
  };

  const fetchPhotos = async (accessToken) => {
    setLoading(true);
    const items = [];
    let nextPageToken;
    try {
      for (let i = 0; i < 3; i++) {
        const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100' + (nextPageToken ? `&pageToken=${nextPageToken}` : ''), {
          headers: {Authorization: `Bearer ${accessToken}`},
        });
        const json = await res.json();
        if (!json.mediaItems) break;
        json.mediaItems.forEach((item) => {
          const {id, baseUrl, filename, mediaMetadata = {}} = item;
          const when = mediaMetadata.creationTime || new Date().toISOString();
          items.push({
            id,
            url: `${baseUrl}=w1600`,
            thumb: `${baseUrl}=w400`,
            filename,
            timestamp: when,
            size: mediaMetadata.fileSize ? Number(mediaMetadata.fileSize) : null,
            location: mediaMetadata.location,
            faces: [],
          });
        });
        nextPageToken = json.nextPageToken;
        if (!nextPageToken) break;
      }
      setPhotos(items);
      setStatus(`Loaded ${items.length} photos`);
      await Promise.all(items.map((p) => cacheItem('photos', p)));
    } catch (err) {
      console.error(err);
      setStatus('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const detectFaces = async (photo) => {
    setStatus(`Detecting faces in ${photo.filename}...`);
    await loadFaceModels();
    const cached = await readItem('faces', photo.id);
    if (cached) {
      setStatus('Faces loaded from cache');
      return cached.faces;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    await img.decode();
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
    const faces = detections.map((d, idx) => ({
      id: `${photo.id}-${idx}`,
      box: d.box,
    }));
    await cacheItem('faces', {photoId: photo.id, faces});
    setStatus(`Detected ${faces.length} faces`);
    return faces;
  };

  const onOpenLightbox = async (photo) => {
    const faces = await detectFaces(photo);
    setLightbox({...photo, faces});
  };

  const filteredPhotos = useMemo(() => {
    const day = selectedDate;
    let result = photos.filter((p) => p.timestamp.startsWith(day));
    if (activeFaceId) {
      result = result.filter((p) => p.faces?.some((f) => f.id === activeFaceId));
    }
    return result;
  }, [photos, selectedDate, activeFaceId]);

  const onFaceClick = async (photo, face) => {
    setActiveFaceId(face.id);
    // Load faces for all photos lazily to filter
    const withFacePromises = photos.map(async (p) => {
      const cache = await readItem('faces', p.id);
      if (cache) return {...p, faces: cache.faces};
      return p;
    });
    const withFaces = await Promise.all(withFacePromises);
    setPhotos(withFaces);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Photo Face Explorer</h1>
          <p className="text-slate-400 text-sm">Frontend-only · Google Photos · face-api.js</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100"
          />
          {!token ? (
            <button
              onClick={handleLogin}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded shadow"
            >
              Sign in with Google
            </button>
          ) : (
            <span className="text-emerald-300 text-sm">Connected</span>
          )}
        </div>
      </header>

      <StatusBar message={status} loading={loading} />

      <Gallery
        photos={filteredPhotos}
        onOpen={onOpenLightbox}
        activeFaceId={activeFaceId}
      />

      {lightbox && (
        <Lightbox
          photo={lightbox}
          onClose={() => setLightbox(null)}
          onFaceClick={onFaceClick}
        />
      )}
    </div>
  );
}

function StatusBar({message, loading}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm flex items-center gap-2">
      {loading && <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse inline-block"></span>}
      <span className="text-slate-200">{message}</span>
    </div>
  );
}

function Gallery({photos, onOpen, activeFaceId}) {
  if (!photos.length) {
    return <p className="text-slate-400">No photos for this date.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen(p)}
          className="relative group rounded overflow-hidden border border-slate-800 bg-slate-900"
        >
          <img
            src={p.thumb || p.url}
            alt={p.filename}
            className="w-full h-48 object-cover group-hover:scale-105 transition"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
          <div className="absolute bottom-2 left-2 text-xs text-white space-y-1">
            <p className="font-semibold">{p.filename}</p>
            <p className="text-slate-300">{new Date(p.timestamp).toLocaleString()}</p>
            {activeFaceId && <span className="inline-block bg-emerald-500 text-slate-900 px-2 py-0.5 rounded text-[11px]">Face filter</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function Lightbox({photo, onClose, onFaceClick}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({w: 1, h: 1});

  useEffect(() => {
    const img = containerRef.current?.querySelector('img');
    if (!img) return;
    const handler = () => setDimensions({w: img.naturalWidth, h: img.naturalHeight});
    img.addEventListener('load', handler);
    return () => img.removeEventListener('load', handler);
  }, [photo.url]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl w-full bg-slate-900 rounded shadow-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-slate-800 text-slate-200 px-3 py-1 rounded hover:bg-slate-700"
        >
          Close
        </button>
        <div ref={containerRef} className="relative">
          <img src={photo.url} alt={photo.filename} className="w-full max-h-[80vh] object-contain" />
          {photo.faces?.map((face) => {
            const {x, y, width, height} = face.box;
            return (
              <button
                key={face.id}
                onClick={() => onFaceClick(photo, face)}
                className="absolute border-2 border-emerald-400/80 bg-emerald-400/10 hover:bg-emerald-400/20 transition"
                style={{
                  left: `${(x / dimensions.w) * 100}%`,
                  top: `${(y / dimensions.h) * 100}%`,
                  width: `${(width / dimensions.w) * 100}%`,
                  height: `${(height / dimensions.h) * 100}%`,
                }}
                title="Filter by this face"
              />
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-800 text-sm text-slate-200 flex flex-wrap gap-4">
          <span>{photo.filename}</span>
          <span>{new Date(photo.timestamp).toLocaleString()}</span>
          {photo.size && <span>{Math.round(photo.size / 1024)} KB</span>}
          {photo.location?.latitude && (
            <span>
              {photo.location.latitude.toFixed(3)}, {photo.location.longitude?.toFixed(3)}
            </span>
          )}
          <span className="text-slate-400">Faces: {photo.faces?.length ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
