import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 1. Import Entities
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { Genre } from './entities/genre.entity';

// 2. Import Controllers & Services
import { AppController } from './modules/app.controller';
import { MusicController } from './modules/music/music.controller';
import { FileManagerService } from './common/file-manager.service';

// 3. Import Modules
import { BenchmarkModule } from './modules/benchmark/benchmark.module';
import { SeederModule } from './modules/seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Kết nối Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // 'db' là tên service trong docker-compose.yml
        host: config.get<string>('DB_HOST', 'db'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'be_music'),
        // Liệt kê trực tiếp Class thay vì dùng chuỗi để tránh lỗi Syntax khi quét file .js.map
        entities: [Artist, Album, Track, Genre],
        synchronize: true,
        timezone: '+07:00',
        logging: false, // Tắt logging để tăng hiệu suất khi xử lý 1 triệu dòng
      }),
    }),

    TypeOrmModule.forFeature([Artist, Album, Track, Genre]),
    BenchmarkModule,
    SeederModule,
  ],
  controllers: [AppController, MusicController],
  providers: [FileManagerService],
})
export class AppModule {}
