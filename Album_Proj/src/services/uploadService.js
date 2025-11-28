import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {awsConfig, s3Prefix} from '../config/aws';

const client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials
});

function buildKey(filename) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const prefix = s3Prefix || '';
  return `${prefix}${Date.now()}_${safe}`;
}

export async function uploadToS3(uri, mimeType, filename) {
  try {
    const response = await fetch(uri);
    if (!response || typeof response.blob !== 'function' || (response.status && (response.status < 200 || response.status >= 600))) {
      throw new Error('Unsupported fetch response for local file');
    }
    const blob = await response.blob();
    const key = buildKey(filename);
    await client.send(
      new PutObjectCommand({
        Bucket: awsConfig.bucket,
        Key: key,
        Body: blob,
        ContentType: mimeType || 'application/octet-stream'
      })
    );
    return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
  } catch (err) {
    console.warn('S3 upload failed, skipping upload for local file', uri, err);
    return undefined;
  }
}
