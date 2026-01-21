import { Controller, Get, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { Track } from '../../entities/track.entity';
import { SeederService } from '../seeder/seeder.service';
import {
  BenchmarkResponseDto,
  SeederProgressDto,
  DatabaseStatsDto,
} from './benchmark.dto';

@ApiTags('Benchmark & Performance Testing')
@Controller('benchmark')
export class BenchmarkController {
  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    private seederService: SeederService,
  ) {}

  // ======================================================
  // 1. SEEDER ENDPOINTS
  // ======================================================

  @Post('seed')
  @ApiOperation({
    summary: '🚀 Chạy Seeder (Tạo dữ liệu giả)',
    description: 'Chạy tiến trình tạo dữ liệu mẫu lớn để test hiệu năng.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 100000,
    description: 'Số lượng bài hát cần tạo (Mặc định: 1,000,000)',
  })
  async runSeeder(@Query('limit') limit: number = 1000000) {
    return this.seederService.seed(Number(limit));
  }

  @Get('seed/progress')
  @ApiOperation({
    summary: '⏳ Xem tiến độ Seeder',
    description: 'Kiểm tra xem quá trình tạo dữ liệu đã chạy đến đâu.',
  })
  @ApiResponse({
    status: 200,
    type: SeederProgressDto,
  })
  getSeederProgress() {
    return this.seederService.getProgress();
  }

  @Get('stats')
  @ApiOperation({
    summary: '📊 Thống kê Database',
    description: 'Xem tổng số lượng Track/Artist/Album hiện có trong DB.',
  })
  @ApiResponse({
    status: 200,
    type: DatabaseStatsDto,
  })
  async getDatabaseStats() {
    return this.seederService.getDatabaseStats();
  }

  // ======================================================
  // 2. SEARCH & BENCHMARK API (Always On)
  // ======================================================

  @Get('search')
  @ApiOperation({
    summary: '🔍 Tìm kiếm & So sánh hiệu năng (Always On)',
    description:
      'API tìm kiếm bài hát. Hệ thống sẽ **tự động** chạy 2 câu truy vấn (Nhanh & Chậm) để so sánh hiệu năng mà không cần tham số kích hoạt.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tìm kiếm kèm báo cáo benchmark',
    type: BenchmarkResponseDto,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Từ khóa tìm kiếm (bắt buộc để kích hoạt Slow Query)',
    example: 'Love',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'track', 'artist', 'album'], // [SỬA] Đổi 'title' thành 'track'
    description: 'Trường dữ liệu cần tìm',
    example: 'all',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<BenchmarkResponseDto> {
    const keyword = q ? q.trim() : '';
    const l = Number(limit) || 20;
    const p = Number(page) || 1;

    // --- 1. FAST QUERY (QueryBuilder + Index) ---
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
      // [SỬA LOGIC] Check filter === 'track' thay vì 'title'
      if (filter === 'track') {
        queryBuilder.where('track.title ILIKE :kw', { kw });
      } else if (filter === 'artist') {
        queryBuilder.where('track.artistName ILIKE :kw', { kw });
      } else if (filter === 'album') {
        queryBuilder.where('track.albumTitle ILIKE :kw', { kw });
      } else {
        // filter === 'all' hoặc mặc định
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

    // --- 2. SLOW QUERY (Raw SQL + Full Scan) ---
    let slowTime = 0;
    let slowExplanation = 'N/A (No keyword provided)';

    if (keyword) {
      const startSlow = performance.now();
      // Câu lệnh Raw SQL cố tình không tối ưu (để so sánh)
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

    return {
      data: results,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
        limit: l,
      },
      benchmark: {
        is_active: true,
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
