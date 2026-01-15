import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from '../../entities/track.entity';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { faker } from '@faker-js/faker';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  // ✅ THÊM: Biến lưu trạng thái tiến độ
  private seedingState = {
    progress: 0,
    isSeeding: false,
    total: 0,
    current: 0,
  };

  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
  ) {}

  // ✅ THÊM: Hàm lấy tiến độ (Frontend gọi cái này)
  getProgress() {
    return this.seedingState;
  }

  async seed(limit: number) {
    if (this.seedingState.isSeeding) {
      this.logger.warn('⚠️ Seeding đang chạy, vui lòng chờ...');
      return { message: 'Already running' };
    }

    this.logger.log(`🚀 Bắt đầu seeding ${limit} bản ghi chuẩn hóa...`);

    // Reset state
    this.seedingState = {
      progress: 0,
      isSeeding: true,
      total: limit,
      current: 0,
    };

    let totalTracksCreated = 0;
    const avgTracksPerArtist = 5 * 12;
    const totalArtists = Math.ceil(limit / avgTracksPerArtist) || 1;

    try {
      for (let i = 0; i < totalArtists; i++) {
        // A. Tạo Artist
        const artist = this.artistRepo.create({
          name: faker.person.fullName(),
          picturePath: faker.image.avatar(),
        });
        await this.artistRepo.save(artist);

        // B. Tạo Album
        const albumCount = faker.number.int({ min: 3, max: 8 });

        for (let j = 0; j < albumCount; j++) {
          const album = this.albumRepo.create({
            title: faker.music.album(),
            releaseYear: faker.number.int({ min: 1990, max: 2024 }),
            coverPath: 'default_cover.jpg',
            artist: artist,
            bitDepth: 16,
            sampleRate: 44100,
          });
          await this.albumRepo.save(album);

          // C. Tạo Tracks
          const trackCount = faker.number.int({ min: 8, max: 15 });
          const tracks: Track[] = [];

          for (let t = 1; t <= trackCount; t++) {
            if (totalTracksCreated >= limit) break;

            const trackName = `${faker.music.songName()} (Track #${totalTracksCreated})`;

            tracks.push(
              this.trackRepo.create({
                title: trackName,
                fileName: `${faker.system.fileName()}.flac`,
                duration: faker.number.int({ min: 180, max: 400 }),
                trackNumber: t,
                album: album,
                benchmarkOrder: totalTracksCreated,
                keyword: `key_${totalTracksCreated}`,
                fileSize: 30000000,
                relativePath: '/music/storage',
              }),
            );
            totalTracksCreated++;
          }

          if (tracks.length > 0) {
            await this.trackRepo.save(tracks);
          }

          // ✅ CẬP NHẬT TIẾN ĐỘ
          this.seedingState.current = totalTracksCreated;
          this.seedingState.progress = Math.floor(
            (totalTracksCreated / limit) * 100,
          );

          if (totalTracksCreated >= limit) break;
        }

        // Log mỗi 5000 records để đỡ spam console
        if (totalTracksCreated % 5000 < 50) {
          this.logger.log(
            `⏳ Progress: ${this.seedingState.progress}% (${totalTracksCreated}/${limit})`,
          );
        }

        if (totalTracksCreated >= limit) break;
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      // Kết thúc
      this.seedingState.isSeeding = false;
      this.seedingState.progress = 100;
      this.logger.log(`✅ Hoàn tất seeding ${totalTracksCreated} tracks!`);
    }

    return { count: totalTracksCreated };
  }
}
