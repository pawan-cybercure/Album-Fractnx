import crypto from "crypto";
import { s3Services } from "../utils/s3config.js";
import {
  addPhotoRecord,
  getPhotoRecords,
} from "../utils/photoStore.js";

const normalizeDateRange = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildRecord = ({ uploadResult, file, selectedDate }) => {
  const uploadedAt = Date.now();
  const providedDate = selectedDate ? new Date(selectedDate) : null;
  const baseDate =
    providedDate && !Number.isNaN(providedDate.getTime())
      ? providedDate
      : new Date(uploadedAt);
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${uploadedAt}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    key: uploadResult.key,
    url: uploadResult.url,
    fileName: file.originalname || file.filename || "photo.jpg",
    selectedDate:
      providedDate && !Number.isNaN(providedDate.getTime())
        ? providedDate.toISOString()
        : null,
    timestamp: uploadedAt,
    createdAt: baseDate.toISOString(),
  };
};

export const uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File is required under `photo` field." });
  }

  const { selectedDate } = req.body;

  try {
    const uploadResult = await s3Services.upload(req.file, "uploads");
    const record = buildRecord({
      uploadResult,
      file: req.file,
      selectedDate,
    });
    await addPhotoRecord(record);

    return res.status(201).json({ photo: record });
  } catch (err) {
    console.error("Upload failed", err);
    return res.status(500).json({ message: "Failed to upload photo", error: err.message });
  }
};

export const getPhotos = async (req, res) => {
  try {
    const { date } = req.query;
    const records = await getPhotoRecords();

    const range = normalizeDateRange(date);
    const filtered = range
      ? records.filter((item) => {
          const time =
            (item.selectedDate && new Date(item.selectedDate).getTime()) ||
            Number(item.timestamp) ||
            (item.createdAt ? new Date(item.createdAt).getTime() : null);
          if (!time) return false;
          return time >= range.start.getTime() && time <= range.end.getTime();
        })
      : records;

    return res.json({ photos: filtered });
  } catch (err) {
    console.error("Fetch failed", err);
    return res.status(500).json({ message: "Failed to fetch photos", error: err.message });
  }
};
