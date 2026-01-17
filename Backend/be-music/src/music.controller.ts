import { Controller, Get, Query, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from './entities/track.entity';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
  ) {}

  // --- API 1: LẤY TẤT CẢ (Cho tab Library) ---
  @Get('all')
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    const [results, total] = await this.trackRepo.findAndCount({
      take: l,
      skip: (p - 1) * l,
      order: { id: 'ASC' },
      select: ['id', 'title', 'duration', 'artistName', 'albumTitle'],
    });

    return {
      data: results,
      total: total,
      page: p,
      lastPage: Math.ceil(total / l),
    };
  }

  // --- API 2: STATS ---
  @Get('stats')
  async getStats() {
    const [tracks, artists, albums] = await Promise.all([
      this.trackRepo.count(),
      this.artistRepo.count(),
      this.albumRepo.count(),
    ]);
    return { tracks, artists, albums };
  }

  // --- API 3: SEARCH SMART (CÓ BENCHMARK DEMO) ---
  @Get('search-smart')
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('benchmark') benchmark: string = 'false', // ✅ Nhận cờ benchmark
  ) {
    const keyword = q ? q.trim() : '';
    const l = Number(limit) || 20;
    const p = Number(page) || 1;

    // =========================================================
    // 1. FAST QUERY (Cách tối ưu: QueryBuilder + Pagination)
    // =========================================================
    const startFast = performance.now();

    const queryBuilder = this.trackRepo
      .createQueryBuilder('track')
      .select([
        'track.id',
        'track.title',
        'track.duration',
        'track.albumTitle',
        'track.artistName',
      ]);

    if (keyword) {
      const kw = `%${keyword}%`;
      // QueryBuilder của Nest/TypeORM thường tối ưu tham số hóa
      if (filter === 'title') {
        queryBuilder.where('track.title ILIKE :kw', { kw });
      } else if (filter === 'artist') {
        queryBuilder.where('track.artistName ILIKE :kw', { kw });
      } else if (filter === 'album') {
        queryBuilder.where('track.albumTitle ILIKE :kw', { kw });
      } else {
        queryBuilder.where(
          '(track.title ILIKE :kw OR track.albumTitle ILIKE :kw OR track.artistName ILIKE :kw)',
          { kw },
        );
      }
    }

    const [results, total] = await queryBuilder
      .orderBy('track.id', 'ASC')
      .skip((p - 1) * l)
      .take(l)
      .getManyAndCount();

    const endFast = performance.now();
    const fastTime = endFast - startFast;

    // =========================================================
    // 2. SLOW QUERY (Mô phỏng Full Table Scan - Native SQL)
    // Chỉ chạy khi bật mode demo để tránh làm chậm server thật
    // =========================================================
    let slowTime = 0;
    let slowExplanation = 'Skipped (Enable Demo Mode to test)';

    if (benchmark === 'true' && keyword) {
      const startSlow = performance.now();

      // ⚠️ KỸ THUẬT DEMO: Sử dụng Raw SQL với hàm xử lý chuỗi trên cột (LOWER)
      // Điều này thường vô hiệu hóa B-Tree Index tiêu chuẩn, ép DB phải quét toàn bộ bảng.
      // Chúng ta lấy count(*) để buộc DB phải duyệt qua hết các dòng khớp.
      await this.trackRepo.query(
        `SELECT COUNT(*) FROM tracks 
         WHERE lower(title) LIKE $1 
         OR lower("artistName") LIKE $1 
         OR lower("albumTitle") LIKE $1`,
        [`%${keyword.toLowerCase()}%`],
      );

      const endSlow = performance.now();
      slowTime = endSlow - startSlow;
      slowExplanation = 'Full Table Scan (Raw SQL, No Index Usage)';
    }

    // =========================================================
    // 3. TRẢ VỀ KẾT QUẢ
    // =========================================================
    return {
      data: results,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
        limit: l,
      },
      // ✅ Cấu trúc benchmark trả về cho Frontend hiển thị
      benchmark: {
        is_active: benchmark === 'true',
        fast_query_time: `${fastTime.toFixed(2)} ms`,
        slow_query_time: slowTime > 0 ? `${slowTime.toFixed(2)} ms` : 'N/A',
        diff_factor: slowTime > 0 ? (slowTime / fastTime).toFixed(1) : '0',
        explanation: {
          fast: 'ORM Query Builder (Optimized)',
          slow: slowExplanation,
        },
      },
    };
  }
}
