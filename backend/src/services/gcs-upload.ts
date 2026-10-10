import { Storage } from '@google-cloud/storage';
import * as crypto from 'crypto';

const BUCKET = 'datemeup-business-assets';

// In Cloud Run, uses Application Default Credentials (no key file needed)
const storage = new Storage({ projectId: 'project-1af074d7-228e-4a43-bc9' });

export type AssetType = 'logo' | 'hero';

export async function uploadBusinessAsset(
  businessId: string,
  assetType: AssetType,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `businesses/${businessId}/${assetType}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const file = storage.bucket(BUCKET).file(filename);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  return `https://storage.googleapis.com/${BUCKET}/${filename}`;
}
