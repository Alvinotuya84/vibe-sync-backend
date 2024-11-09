import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { getTypeOrmConfig } from './config/typeorm.config';
import { SettingsModule } from './settings/settings.module';
import { ContentModule } from './content/content.module';
import { InteractionsModule } from './interactions/interactions.module';
import { DatabaseModule } from 'database/database.module';
import { ensureUploadDirectoriesExist } from './utils/upload.utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    AuthModule,
    UsersModule,
    SettingsModule,
    ContentModule,
    InteractionsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'UPLOAD_INIT',
      useFactory: () => {
        ensureUploadDirectoriesExist();
        return true;
      },
    },
  ],
})
export class AppModule {}
