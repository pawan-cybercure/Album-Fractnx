export const awsConfig = {
  region: 'YOUR_AWS_REGION',
  bucket: 'YOUR_S3_BUCKET',
  credentials: {
    accessKeyId: 'ACCESS_KEY',
    secretAccessKey: 'SECRET_KEY'
  }
};

// Optional: prefix to namespace uploads in the bucket
export const s3Prefix = 'uploads/';
