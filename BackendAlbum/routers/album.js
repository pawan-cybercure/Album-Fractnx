import { Router } from "express";
import multer from "multer";
import { uploadPhoto, getPhotos } from "../controllers/album.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/photos/upload", upload.single("photo"), uploadPhoto);
router.get("/photos", getPhotos);

export default router;
