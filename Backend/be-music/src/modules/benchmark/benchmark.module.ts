import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenchmarkController } from './benchmark.controller';
import { SeederService } from '../seeder/seeder.service';
import { Track } from '../../entities/track.entity';
import { Album } from '../../entities/album.entity';
import { Artist } from '../../entities/artist.entity';
import { SeederModule } from '../seeder/seeder.module';

@Module({
  // Đăng ký các Entity cần dùng để test
  imports: [TypeOrmModule.forFeature([Track, Album, Artist]), SeederModule],
  controllers: [BenchmarkController],
  providers: [SeederService],
})
export class BenchmarkModule {}
