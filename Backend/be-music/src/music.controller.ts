import { Controller, Get, Query, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Track } from './entities/track.entity';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { performance } from 'perf_hooks';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(@InjectRepository(Track) private trackRepo: Repository<Track>) {}

  // --- API STATS ---
  @Get('stats')
  async getStats() {
    const tracks = await this.trackRepo.count();
    const artists = await this.trackRepo.manager.count(Artist);
    const albums = await this.trackRepo.manager.count(Album);
    return { tracks, artists, albums };
  }

  // --- API ALL LIBRARY ---
  @Get('all')
  async getAllMusic(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;

    const [data, total] = await this.trackRepo.findAndCount({
      take: l,
      skip: skip,
      order: { createdAt: 'DESC' },
      relations: ['album', 'album.artist'],
    });

    return {
      data,
      total,
      page: p,
      lastPage: Math.ceil(total / l),
    };
  }

  // --- API SEARCH SMART (CẬP NHẬT) ---
  @Get('search-smart')
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all', // 'all' | 'title' | 'artist' | 'album'
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const keyword = q ? q.trim() : '';
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;

    // 1. Xây dựng điều kiện tìm kiếm dựa trên Filter
    let whereCondition: any[] = [];
    const term = Like(`%${keyword}%`);

    if (filter === 'title') {
      whereCondition = [{ title: term }];
    } else if (filter === 'artist') {
      whereCondition = [{ album: { artist: { name: term } } }];
    } else if (filter === 'album') {
      whereCondition = [{ album: { title: term } }];
    } else {
      // Default 'all': Tìm trên cả 3 trường
      whereCondition = [
        { title: term },
        { album: { title: term } },
        { album: { artist: { name: term } } },
      ];
    }

    // 2. Benchmark (Chỉ chạy khi ở trang 1 để không làm chậm các trang sau)
    // ✅ SỬA LỖI Ở ĐÂY: Thêm kiểu ": any" để TypeScript không ép kiểu null
    let benchmarkData: any = null;

    if (p === 1 && filter === 'all') {
      // Warm-up & Test Logic (Giữ nguyên code cũ của bạn)
      const matchId = keyword.match(/(\d+)/);
      const testId = matchId ? parseInt(matchId[0]) : 900000;

      await this.trackRepo.findOne({ where: { id: 'dummy' } }).catch(() => {});

      const t1 = performance.now();
      await this.trackRepo.findOne({
        where: { title: Like(`Track #${testId}%`) },
      });
      const fastTime = performance.now() - t1;

      const t2 = performance.now();
      await this.trackRepo.findOne({ where: { benchmarkOrder: testId } });
      const slowTime = performance.now() - t2;

      benchmarkData = {
        testId_used: testId,
        fast_query_time: fastTime.toFixed(4) + ' ms',
        slow_query_time: slowTime.toFixed(4) + ' ms',
        diff_factor: (slowTime / (fastTime || 0.01)).toFixed(1) + 'x',
        explanation: { fast: `Index Scan`, slow: `Full Scan` },
      };
    }

    // 3. Query chính (Có phân trang)
    const [results, total] = await this.trackRepo.findAndCount({
      where: whereCondition,
      take: l,
      skip: skip,
      relations: ['album', 'album.artist'], // Lấy đủ data để highlight
      order: { title: 'ASC' },
    });

    return {
      data: results,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
      },
      benchmark: benchmarkData,
    };
  }
}
