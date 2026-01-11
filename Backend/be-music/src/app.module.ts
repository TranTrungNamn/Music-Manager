import { Controller, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 1. Import Entities
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';

// 2. Import Controllers & Services
import { AppController } from './modules/app.controller'; // <-- Đã thêm lại
import { MusicController } from './music.controller';
import { FileManagerService } from './common/file-manager.service'; // <-- QUAN TRỌNG: Import Service này

// 3. Import Modules
import { BenchmarkModule } from './modules/benchmark/benchmark.module';

@Module({
  imports: [
    // Cấu hình Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Kết nối Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Artist, Album, Track],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),

    // Đăng ký Entities
    TypeOrmModule.forFeature([Artist, Album, Track]),

    // Các module tính năng khác
    BenchmarkModule,
  ],
  // --- KHU VỰC SỬA LỖI ---
  controllers: [
    AppController, // <-- Đã thêm lại AppController
    MusicController,
  ],
  providers: [
    FileManagerService, // <-- QUAN TRỌNG: Phải khai báo Service ở đây thì AppController mới dùng được
  ],
})
export class AppModule {}
