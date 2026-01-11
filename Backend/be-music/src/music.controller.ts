import { Controller, Get, Query, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { performance } from 'perf_hooks';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  @Get('stats')
  async getStats() {
    const [artists, albums, tracks] = await Promise.all([
      this.artistRepo.count(),
      this.albumRepo.count(),
      this.trackRepo.count(),
    ]);
    return { artists, albums, tracks };
  }

  // --- API TÌM KIẾM TÍCH HỢP BENCHMARK ---
  @Get('search-smart')
  async searchSmart(@Query('q') q: string) {
    const keyword = q ? q.trim() : '';
    this.logger.log(`🔍 [SEARCH]: Đang tìm "${keyword}" và đo hiệu năng...`);

    // 1. PHẦN ĐO HIỆU SUẤT (BENCHMARK)
    // Để demo cho giáo viên thấy sự chênh lệch, ta sẽ chạy 2 query kiểm tra ngầm:
    // Query A (Nhanh): Tìm chính xác theo Title (Có Index)
    // Query B (Chậm): Tìm chính xác theo FileName (Không Index)

    let fastTime = 0;
    let slowTime = 0;

    // Mẹo: Nếu keyword chứa số (ví dụ "500"), ta giả lập tìm bản ghi ID đó để so sánh công bằng nhất
    const matchId = keyword.match(/(\d+)/);
    const testId = matchId ? matchId[0] : '900000'; // Mặc định test bài 900k nếu không nhập số

    // Đo query NHANH (Index Scan)
    const t1 = performance.now();
    await this.trackRepo.findOne({ where: { title: `Track #${testId}` } });
    fastTime = performance.now() - t1;

    // Đo query CHẬM (Full Table Scan)
    const t2 = performance.now();
    await this.trackRepo.findOne({
      where: { fileName: `file_${testId}.flac` },
    });
    slowTime = performance.now() - t2;

    // 2. PHẦN LẤY DỮ LIỆU HIỂN THỊ (REAL DATA)
    // Tìm kiếm ILIKE để hiển thị kết quả cho người dùng xem
    const query = this.trackRepo
      .createQueryBuilder('track')
      .leftJoinAndSelect('track.album', 'album')
      .leftJoinAndSelect('album.artist', 'artist')
      .limit(50)
      .orderBy('track.createdAt', 'DESC');

    if (keyword) {
      query.where('track.title ILIKE :q OR artist.name ILIKE :q', {
        q: `%${keyword}%`,
      });
    }
    const results = await query.getMany();

    return {
      data: results,
      benchmark: {
        fast: fastTime,
        slow: slowTime,
        diff: slowTime / (fastTime || 1), // Nhanh hơn bao nhiêu lần
        details: {
          fastQuery: `SELECT ... WHERE title = 'Track #${testId}' (Index Scan)`,
          slowQuery: `SELECT ... WHERE fileName = 'file_${testId}.flac' (Seq Scan)`,
        },
      },
    };
  }
}
