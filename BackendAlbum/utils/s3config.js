import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BASE_PREFIX =
  (process.env.AWS_S3_BASE_PREFIX &&
    process.env.AWS_S3_BASE_PREFIX.replace(/^\/*/, "").replace(/\/*$/, "")) ||
  "album_project/photos";

class S3Services {
  upload = async (file, dir = "uploads") => {
    if (!file || !file.buffer) {
      throw new Error("No file buffer provided for upload");
    }

    try {
      const safeDir = dir ? dir.replace(/^\/*/, "").replace(/\.\./g, "") : "uploads";
      const prefix = BASE_PREFIX ? `${BASE_PREFIX}/${safeDir}` : safeDir;
      const safeName =
        file?.originalname?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
        `photo_${Date.now()}`;
      const key = `${prefix}/${Date.now()}-${safeName}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.send(new PutObjectCommand(params));

      return {
        key,
        url: this.#buildPublicUrl(key),
      };
    } catch (err) {
      throw new Error(`file upload to S3 Error: ${err.message}`);
    }
  };

  remove = async (url) => {
    const key = this.#extractKeyFromUrl(url);
    if (!key) return;

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        })
      );
    } catch (err) {
      throw new Error(`file delete from S3 Error: ${err.message}`);
    }
  };

  removeMany = async (urls = []) => {
    const tasks = urls
      .map((url) => this.#extractKeyFromUrl(url))
      .filter(Boolean)
      .map((key) =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          })
        )
      );

    await Promise.allSettled(tasks);
  };

  getObjectStream = async (url) => {
    const key = this.#extractKeyFromUrl(url);
    if (!key) return null;

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
    );

    return response;
  };

  #extractKeyFromUrl = (url = "") => {
    if (!url || typeof url !== "string") return null;

    const bucket = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const directPattern = new RegExp(
      `https?://s3[.-]${region}\\.amazonaws\\.com/${bucket}/(.+)`
    );
    const virtualHostedPattern = new RegExp(
      `https?://${bucket}\\.s3[.-]${region}\\.amazonaws\\.com/(.+)`
    );

    const directMatch = url.match(directPattern);
    if (directMatch && directMatch[1]) {
      return directMatch[1];
    }

    const hostedMatch = url.match(virtualHostedPattern);
    if (hostedMatch && hostedMatch[1]) {
      return hostedMatch[1];
    }

    return url.startsWith(`${BASE_PREFIX}/`) ? url : null;
  };

  #buildPublicUrl = (key) =>
    `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

const s3Services = new S3Services();

export { s3, s3Services };
