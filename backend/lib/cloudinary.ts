import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function buildSignedUpload(userId: string): SignedUploadParams {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary env vars are not configured.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `toilet-uz/users/${userId}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  return { timestamp, signature, apiKey, cloudName, folder };
}

export async function uploadServerSide(
  fileBase64: string,
  folder: string
): Promise<UploadApiResponse> {
  if (!cloudName) throw new Error('Cloudinary not configured.');

  return cloudinary.uploader.upload(fileBase64, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });
}

export function isCloudinaryUrl(url: string): boolean {
  if (!cloudName) return false;
  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}
