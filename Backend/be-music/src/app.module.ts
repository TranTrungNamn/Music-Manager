import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import Entities (Đảm bảo các file này tồn tại trong src/entities/)
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';

// Import Module chứa Seeder (Đảm bảo đường dẫn này chính xác)
import { BenchmarkModule } from './modules/benchmark/benchmark.module';

@Module({
  imports: [
    // 1. Cấu hình biến môi trường
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Kết nối Database Neon
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Artist, Album, Track],
        synchronize: true, // Tự động tạo bảng trên Neon
        ssl: {
          rejectUnauthorized: false, // Bắt buộc cho Neon Console
        },
      }),
    }),

    // 3. Đăng ký Entities
    TypeOrmModule.forFeature([Artist, Album, Track]),

    // 4. Module chứa logic Seeder của bạn
    BenchmarkModule,
  ],
  controllers: [], // Xóa AppController để tránh lỗi TS2307
  providers: [], // Xóa AppService để tránh lỗi TS2307
})
export class AppModule {}
