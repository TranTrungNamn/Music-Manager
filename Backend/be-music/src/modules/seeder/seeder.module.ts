import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';

// Import các Entity để Seeder có thể thao tác với Database
import { Track } from '../../entities/track.entity';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { Genre } from '../../entities/genre.entity';

@Module({
  imports: [
    // Đăng ký Feature cho các Entity cần dùng trong SeederService
    TypeOrmModule.forFeature([Track, Artist, Album, Genre]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
