import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenchmarkController } from './benchmark.controller';
import { Track } from '../../entities/track.entity';
import { Album } from '../../entities/album.entity';
import { Artist } from '../../entities/artist.entity';
import { SeederModule } from '../seeder/seeder.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, Album, Artist]),
    SeederModule, // Đã export SeederService
  ],
  controllers: [BenchmarkController],
})
export class BenchmarkModule {}
