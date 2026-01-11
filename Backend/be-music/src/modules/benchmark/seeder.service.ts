import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { Track } from '../../entities/track.entity';
import { performance } from 'perf_hooks';
import { randomUUID } from 'crypto';

@Injectable()
export class SeederService {
  private readonly logger = new Logger('SEEDER-LOG');
  private currentProgress = 0;
  private isSeeding = false;

  private readonly syllables = [
    'mon',
    'fay',
    'shi',
    'zag',
    'blarg',
    'rash',
    'izen',
    'sky',
    'blue',
    'dark',
    'light',
    'fire',
    'wind',
    'rain',
    'snow',
    'star',
    'sun',
    'moon',
    'alu',
    'kar',
    'sim',
    'to',
    'ni',
    'vel',
    'kan',
    'xio',
    'phu',
    'qui',
    'za',
    'do',
    're',
    'mi',
    'bi',
    'ka',
    'lo',
    've',
    'mu',
    'sic',
    'pro',
    'max',
    'ul',
    'tra',
    'neo',
  ];

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  async getProgress() {
    return { progress: this.currentProgress, isSeeding: this.isSeeding };
  }

  private generateName(minWords = 1, maxWords = 2): string {
    const wordCount =
      Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const syl1 =
        this.syllables[Math.floor(Math.random() * this.syllables.length)];
      const syl2 =
        this.syllables[Math.floor(Math.random() * this.syllables.length)];
      const word = syl1 + syl2;
      words.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return words.join(' ');
  }

  async seed(limit: number) {
    if (this.isSeeding) return { message: 'Đang chạy...' };
    this.isSeeding = true;
    this.currentProgress = 0;

    const TARGET_TRACKS = limit > 0 ? limit : 1000000;
    const MAX_ARTISTS = 50;
    const MAX_ALBUMS = 50;
    const TRACKS_PER_BATCH = 2000;

    this.logger.log(
      `🚀 Bắt đầu tạo ${TARGET_TRACKS.toLocaleString()} tracks (Realism Mode)...`,
    );

    try {
      // BƯỚC 1: TẠO ARTIST & ALBUM
      const artists: Artist[] = [];
      const albums: any[] = [];
      const albumIds: string[] = [];

      for (let i = 0; i < MAX_ARTISTS; i++) {
        const artist = new Artist();
        artist.id = randomUUID();
        artist.name = this.generateName(2, 3);
        artist.picturePath = `/artists/img_${i}.jpg`;
        artists.push(artist);
      }
      await this.artistRepo.save(artists);

      for (let i = 0; i < MAX_ALBUMS; i++) {
        const albumId = randomUUID();
        albums.push({
          id: albumId,
          title: this.generateName(1, 3), // ✨ Tên Album ngẫu nhiên (Ko có chữ Album)
          artist: artists[Math.floor(Math.random() * artists.length)],
          releaseYear: 2024,
          coverPath: `/covers/img_${i}.jpg`,
          bitDepth: 16,
          sampleRate: 44100,
        });
        albumIds.push(albumId);
      }
      await this.albumRepo
        .createQueryBuilder()
        .insert()
        .into(Album)
        .values(albums)
        .execute();
      this.logger.log(`✅ Init metadata xong.`);

      // BƯỚC 2: TẠO TRACKS
      let createdTracks = 0;
      const startTime = performance.now();

      while (createdTracks < TARGET_TRACKS) {
        const tracks: any[] = [];
        const remaining = TARGET_TRACKS - createdTracks;
        const batchSize =
          remaining < TRACKS_PER_BATCH ? remaining : TRACKS_PER_BATCH;

        for (let k = 0; k < batchSize; k++) {
          createdTracks++;
          const currentId = createdTracks;

          // ✨ DỮ LIỆU THẬT (Không prefix rác)
          const songName = this.generateName(2, 4); // VD: "Blue Sky"
          const randomSuffix = Math.floor(Math.random() * 9999);
          const fileName = `${songName.replace(/\s/g, '_')}_${randomSuffix}.flac`;

          tracks.push({
            title: songName,
            fileName: fileName,

            // ✨ CỘT DÀNH RIÊNG CHO BENCHMARK
            keyword: `key_${currentId}`, // Dùng để test Fast Query
            benchmarkOrder: currentId, // Dùng để test Slow Query

            trackNumber: Math.floor(Math.random() * 12) + 1,
            extension: 'flac',
            relativePath: `/Music/${fileName}`,
            duration: 180 + Math.floor(Math.random() * 100),
            bitrate: 1411,
            sampleRate: 44100,
            bitDepth: 16,
            fileSize: 30000000,
            album: {
              id: albumIds[Math.floor(Math.random() * albumIds.length)],
            },
          });
        }

        await this.trackRepo
          .createQueryBuilder()
          .insert()
          .into(Track)
          .values(tracks)
          .execute();

        this.currentProgress = Math.min(
          Math.round((createdTracks / TARGET_TRACKS) * 100),
          100,
        );
        if (createdTracks % 50000 === 0) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          this.logger.log(
            `⚡ Speed: ${this.currentProgress}% | Inserted: ${createdTracks.toLocaleString()} | Time: ${elapsed}s`,
          );
        }
      }

      this.logger.log('🎉 Seed thành công!');
    } catch (error: any) {
      this.logger.error('❌ Lỗi Seeding:', error);
      this.isSeeding = false;
      return { success: false, error: error.message };
    }

    this.isSeeding = false;
    return { success: true };
  }

  // (Giữ nguyên hàm compare cũ hoặc xóa đi nếu không dùng)
  async compare() {
    return {};
  }
}
