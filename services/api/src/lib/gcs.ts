import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = process.env.GCS_DOCUMENTS_BUCKET || "sunriseobx-proj-documents";

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
}

export async function uploadBuffer(
  buffer: Buffer,
  destPath: string,
  contentType: string = "application/pdf"
): Promise<string> {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file(destPath);
  await file.save(buffer, { contentType, resumable: false });
  return destPath;
}

export async function getSignedUrl(destPath: string, expiresMinutes: number = 15): Promise<string> {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file(destPath);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresMinutes * 60 * 1000,
  });
  return url;
}

export async function downloadBuffer(destPath: string): Promise<Buffer> {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file(destPath);
  const [contents] = await file.download();
  return contents;
}
