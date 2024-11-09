// scripts/reset-database.ts
import { createConnection } from 'typeorm';

import * as fs from 'fs/promises';
import * as path from 'path';

async function resetDatabase() {
  try {
    const connection = await createConnection();
    console.log('Connected to database');

    // Drop all tables
    await connection.dropDatabase();
    console.log('Dropped database');

    // Synchronize database to recreate tables
    await connection.synchronize();
    console.log('Recreated database schema');

    // Clear uploaded files
    const uploadPaths = [
      'uploads/content/media',
      'uploads/content/thumbnail',
      'uploads/profile',
    ];

    for (const uploadPath of uploadPaths) {
      const fullPath = path.join(process.cwd(), uploadPath);
      try {
        await fs.rm(fullPath, { recursive: true });
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`Cleared and recreated ${uploadPath}`);
      } catch (error) {
        console.log(`No directory to clear at ${uploadPath}`);
      }
    }

    await connection.close();
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
