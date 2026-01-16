import { Controller, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 1. Import Entities
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { Genre } from './entities/genre.entity';

// 2. Import Controllers & Services
import { AppController } from './modules/app.controller';
import { MusicController } from './music.controller';
import { FileManagerService } from './common/file-manager.service';

// 3. Import Modules
import { BenchmarkModule } from './modules/benchmark/benchmark.module';

@Module({
  imports: [
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
        entities: [Artist, Album, Track, Genre],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    // Đăng ký Entities cho các repository
    TypeOrmModule.forFeature([Artist, Album, Track, Genre]),
    BenchmarkModule,
  ],
  controllers: [AppController, MusicController],
  providers: [FileManagerService],
})
export class AppModule {}
