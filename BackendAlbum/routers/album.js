import { Router } from "express";
import multer from "multer";
import {
  uploadPhoto,
  getPhotos,
  uploadPhotoV2,
  getPhotosV2,
} from "../controllers/album.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/photos/upload", upload.single("photo"), uploadPhoto);
router.get("/photos", getPhotos);

// Fresh endpoints
router.post("/s3/photos/upload", upload.single("photo"), uploadPhotoV2);
router.get("/s3/photos", getPhotosV2);

export default router;
