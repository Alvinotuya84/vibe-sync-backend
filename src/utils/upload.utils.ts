// src/utils/upload.util.ts
import * as fs from 'fs';
import * as path from 'path';

export const UPLOAD_DIRECTORIES = [
  'uploads/content/media',
  'uploads/content/thumbnail',
  'uploads/profile-images',
];

export function ensureUploadDirectoriesExist() {
  UPLOAD_DIRECTORIES.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}
