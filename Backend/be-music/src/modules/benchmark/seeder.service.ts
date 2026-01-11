// Backend/be-music/src/modules/benchmark/seeder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { Track } from '../../entities/track.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger('SEEDER-LOG');
  private currentProgress = 0;
  private isSeeding = false;

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  async getProgress() {
    return { progress: this.currentProgress, isSeeding: this.isSeeding };
  }

  // Thêm lại hàm compare để sửa lỗi TS2339 trong Controller
  async compare() {
    this.logger.log('📊 Đang chạy báo cáo so sánh hiệu suất...');
    return {
      message: 'Tính năng so sánh đang được cập nhật',
      timestamp: new Date(),
    };
  }

  async seed() {
    if (this.isSeeding) return { message: 'Đang chạy...' };
    this.isSeeding = true;
    this.currentProgress = 0;

    let album = await this.albumRepo.findOne({
      where: {},
      relations: ['artist'],
    });
    if (!album) {
      const artist = await this.artistRepo.save(
        this.artistRepo.create({ name: 'Default Artist' }),
      );
      album = await this.albumRepo.save(
        this.albumRepo.create({ title: 'Default Album', artist }),
      );
    }

    const totalTracks = 1000000;
    const batchSize = 5000;
    const totalBatches = totalTracks / batchSize;

    for (let i = 0; i < totalBatches; i++) {
      // SỬA LỖI: Định nghĩa kiểu Partial<Track>[] cho mảng tracks
      const tracks: Partial<Track>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const index = i * batchSize + j;
        tracks.push({
          title: `Track #${index}`,
          fileName: `file_${index}.flac`,
          relativePath: `/music/${index}.flac`,
          duration: 200,
          bitrate: 1411,
          sampleRate: 44100,
          bitDepth: 16,
          fileSize: 1024 * 1024,
          album: { id: album.id } as Album,
        });
      }

      await this.trackRepo
        .createQueryBuilder()
        .insert()
        .into(Track)
        .values(tracks)
        .execute();

      this.currentProgress = Math.round(((i + 1) / totalBatches) * 100);

      if ((i + 1) % 20 === 0) {
        console.log(
          `⏳ [BACKEND]: Đã xong ${this.currentProgress}% (${(i + 1) * batchSize} bản ghi)`,
        );
      }
    }

    this.isSeeding = false;
    return { success: true };
  }
}
