// src/database/database.service.ts
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import * as fs from 'fs/promises';
import * as path from 'path';
import { Like } from 'src/interactions/entities/like.entity';
import { Comment } from 'src/interactions/entities/comment.entity';
import { Subscription } from 'src/interactions/entities/subscription.entity';
import { Content } from 'src/content/entities/content.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
  ) {}

  async resetDatabase() {
    const queryRunner = this.entityManager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete records in correct order (respect foreign keys)
      await queryRunner.manager.delete(Like, {});
      await queryRunner.manager.delete(Comment, {});
      await queryRunner.manager.delete(Subscription, {});
      await queryRunner.manager.delete(Content, {});
      await queryRunner.manager.delete(User, {});

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

      await queryRunner.commitTransaction();
      return { success: true, message: 'Database reset complete' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// src/database/database.module.ts
