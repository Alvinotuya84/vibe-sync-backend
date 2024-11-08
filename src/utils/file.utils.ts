import * as fs from 'fs/promises';
import * as path from 'path';

export async function ensureDirectoryExists(directoryPath: string) {
  try {
    await fs.access(directoryPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(directoryPath, { recursive: true });
  }
}

export const UPLOAD_PATHS = {
  CONTENT: {
    MEDIA: path.join(process.cwd(), 'uploads', 'content', 'media'),
    THUMBNAILS: path.join(process.cwd(), 'uploads', 'content', 'thumbnail'),
  },
};
