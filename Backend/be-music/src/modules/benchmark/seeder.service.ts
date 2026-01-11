import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { Track } from '../../entities/track.entity';
import { performance } from 'perf_hooks';
import { randomUUID } from 'crypto'; // Sử dụng thư viện có sẵn của Node.js

@Injectable()
export class SeederService {
  private readonly logger = new Logger('SEEDER-LOG');
  private currentProgress = 0;
  private isSeeding = false;

  // Bộ âm tiết để sinh tên (Vô hạn tổ hợp)
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

  // --- HÀM TẠO TÊN RANDOM ---
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

  // --- LOGIC SEEDING TỐI ƯU (Batch Processing) ---
  async seed(limit: number) {
    if (this.isSeeding) return { message: 'Đang chạy...' };
    this.isSeeding = true;
    this.currentProgress = 0;

    const TARGET_TRACKS = limit > 0 ? limit : 1000000;
    this.logger.log(
      `🚀 Bắt đầu tạo ${TARGET_TRACKS.toLocaleString()} tracks (Chế độ Turbo Bulk Insert)...`,
    );

    let createdTracks = 0;

    // Cấu hình Batch: Mỗi lần xử lý 1 cụm lớn để giảm số lần gọi DB
    // Ví dụ: Tạo 100 Artist -> 300 Album -> 3000 Track một lúc
    const ARTISTS_PER_BATCH = 200;

    try {
      while (createdTracks < TARGET_TRACKS) {
        // 1. Chuẩn bị dữ liệu trong RAM (Memory)
        const artists: any[] = [];
        const albums: any[] = [];
        const tracks: any[] = [];

        for (let i = 0; i < ARTISTS_PER_BATCH; i++) {
          if (createdTracks >= TARGET_TRACKS) break;

          // A. Tạo Artist (Tự sinh UUID luôn)
          const artistId = randomUUID();
          const artistName = this.generateName(2, 3); // Tên 2-3 từ

          artists.push({
            id: artistId,
            name: artistName,
            // Thêm các trường khác nếu entity yêu cầu
          });

          // B. Tạo Album cho Artist này (1-4 album)
          const albumCount = Math.floor(Math.random() * 4) + 1;

          for (let j = 0; j < albumCount; j++) {
            if (createdTracks >= TARGET_TRACKS) break;

            const albumId = randomUUID();
            const albumTitle = `Album ${this.generateName(1, 2)}`;

            albums.push({
              id: albumId,
              title: albumTitle,
              artist: { id: artistId }, // Link với Artist trên bằng UUID
              releaseYear: Math.floor(Math.random() * (2024 - 1990 + 1)) + 1990,
              bitDepth: Math.random() > 0.5 ? 16 : 24,
              sampleRate: Math.random() > 0.5 ? 44.1 : 48.0,
              coverPath: `/covers/img_${Math.floor(Math.random() * 1000)}.jpg`,
            });

            // C. Tạo Tracks cho Album này (8-15 bài)
            const trackCount = Math.floor(Math.random() * 8) + 8;

            for (let k = 1; k <= trackCount; k++) {
              const songName = this.generateName(2, 4);
              const fileName = `${k.toString().padStart(2, '0')}. ${songName}.flac`;

              tracks.push({
                title: songName,
                fileName: fileName,
                trackNumber: k,
                extension: 'flac',
                relativePath: `/${artistName}/${albumTitle}/${fileName}`,
                duration: 180 + Math.floor(Math.random() * 120),
                bitrate: 1411,
                sampleRate: 44100,
                bitDepth: 16,
                fileSize:
                  20 * 1024 * 1024 + Math.floor(Math.random() * 10000000),
                album: { id: albumId }, // Link với Album trên bằng UUID
              });

              createdTracks++;
              if (createdTracks >= TARGET_TRACKS) break;
            }
          }
        }

        // 2. BULK INSERT (Chỉ 3 lệnh Insert cho hàng nghìn dòng dữ liệu)
        if (artists.length > 0) {
          // Insert Artist (Bỏ qua lỗi nếu trùng ID - dù rất hiếm khi dùng UUID)
          await this.artistRepo
            .createQueryBuilder()
            .insert()
            .into(Artist)
            .values(artists)
            .orIgnore()
            .execute();

          // Insert Album
          await this.albumRepo
            .createQueryBuilder()
            .insert()
            .into(Album)
            .values(albums)
            .orIgnore()
            .execute();

          // Insert Track
          await this.trackRepo
            .createQueryBuilder()
            .insert()
            .into(Track)
            .values(tracks)
            .execute();
        }

        // 3. Cập nhật tiến độ
        this.currentProgress = Math.min(
          Math.round((createdTracks / TARGET_TRACKS) * 100),
          100,
        );

        if (createdTracks % 10000 === 0 || createdTracks >= TARGET_TRACKS) {
          this.logger.log(
            `⚡ Speed: ${this.currentProgress}% (${createdTracks.toLocaleString()}/${TARGET_TRACKS.toLocaleString()})`,
          );
        }
      }

      this.logger.log('✅ HOÀN TẤT! Dữ liệu đã được tạo thành công.');
    } catch (error: any) {
      this.logger.error('❌ Lỗi Seeding:', error);
      this.isSeeding = false;
      return { success: false, error: error.message };
    }

    this.isSeeding = false;
    return { success: true };
  }

  // --- Hàm Compare (Benchmark) ---
  async compare() {
    this.logger.log('📊 Chạy benchmark...');

    // Test tìm bài hát thứ 5 (Full Scan nếu không index)
    const start1 = performance.now();
    await this.trackRepo.find({ where: { trackNumber: 5 }, take: 50 });
    const end1 = performance.now();
    const plan1 = await this.trackRepo.query(
      'EXPLAIN ANALYZE SELECT * FROM tracks WHERE "trackNumber" = 5 LIMIT 50',
    );

    // Test tìm tên bài hát (Index Scan)
    // Lấy đại 1 tên để test
    const randomTrack = await this.trackRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
    const titleToFind = randomTrack ? randomTrack.title : 'Unknown';

    const start2 = performance.now();
    await this.trackRepo.find({ where: { title: titleToFind }, take: 50 });
    const end2 = performance.now();
    const plan2 = await this.trackRepo.query(
      `EXPLAIN ANALYZE SELECT * FROM tracks WHERE title = '${titleToFind}' LIMIT 50`,
    );

    return {
      slow_query: {
        name: 'Query (No Index)',
        time: end1 - start1,
        description: 'Tìm bài hát track #5',
        plan: plan1,
      },
      fast_query: {
        name: 'Query (Index)',
        time: end2 - start2,
        description: `Tìm bài hát tên "${titleToFind}"`,
        plan: plan2,
      },
    };
  }
}
