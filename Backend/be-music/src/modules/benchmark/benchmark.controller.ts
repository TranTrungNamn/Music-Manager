import { Controller, Get, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Track } from '../../entities/track.entity';
import { SeederService } from '../seeder/seeder.service';
import {
  BenchmarkResponseDto,
  SeederProgressDto,
  DatabaseStatsDto,
  SearchQueryDto, // Import DTO mới
} from './benchmark.dto';

@ApiTags('Benchmark & Performance Testing')
@Controller('benchmark')
export class BenchmarkController {
  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    private seederService: SeederService,
    private dataSource: DataSource, // 👈 Inject DataSource để dùng Transaction
  ) {}

  // ======================================================
  // 1. DATA SEEDING ENDPOINTS (Giữ nguyên)
  // ======================================================

  @Post('seed')
  @ApiOperation({ summary: 'Execute Data Seeder' })
  async runSeeder(@Query('limit') limit: number = 1000000) {
    return this.seederService.seed(Number(limit));
  }

  @Get('seed/progress')
  @ApiOperation({ summary: 'Get Seeder Progress' })
  @ApiResponse({ status: 200, type: SeederProgressDto })
  getSeederProgress() {
    return this.seederService.getProgress();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Database Statistics' })
  @ApiResponse({ status: 200, type: DatabaseStatsDto })
  async getDatabaseStats() {
    return this.seederService.getDatabaseStats();
  }

  // ======================================================
  // 2. SEARCH & BENCHMARK API (Đã Cập Nhật Bật/Tắt Index)
  // ======================================================

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm & Test hiệu năng (Bật/Tắt Index)',
    description:
      'Sử dụng Bypass Index = true để ép DB quét toàn bộ bảng (Full Table Scan - Rất chậm).',
  })
  @ApiResponse({
    status: 200,
    type: BenchmarkResponseDto,
  })
  async searchSmart(
    @Query() query: SearchQueryDto,
  ): Promise<BenchmarkResponseDto> {
    const keyword = query.q ? query.q.trim() : '';
    const l = query.limit || 20;
    const p = query.page || 1;
    const isBypass = query.bypassIndex; // Lấy cờ bypass từ Swagger (true/false)

    let results: Track[] = [];
    let total = 0;
    let executionTimeMs = 0;

    // --- SỬ DỤNG TRANSACTION ĐỂ CẤU HÌNH INDEX KHÔNG ẢNH HƯỞNG CÁC REQUEST KHÁC ---
    await this.dataSource.transaction(async (manager) => {
      // 1. Cấu hình Index cho Transaction này (PostgreSQL)
      if (isBypass) {
        // Tắt Index => Ép DB quét tuần tự
        await manager.query('SET LOCAL enable_indexscan = off;');
        await manager.query('SET LOCAL enable_bitmapscan = off;');
      } else {
        // Bật Index (Mặc định)
        await manager.query('SET LOCAL enable_indexscan = on;');
        await manager.query('SET LOCAL enable_bitmapscan = on;');
      }

      // 2. Tạo Query Builder trên Transaction Manager
      const queryBuilder = manager
        .createQueryBuilder(Track, 'track')
        .select([
          'track.id',
          'track.title',
          'track.duration',
          'track.albumTitle',
          'track.artistName',
        ]);

      if (keyword) {
        const kw = `%${keyword}%`;
        if (query.filter === 'track') {
          queryBuilder.where('track.title ILIKE :kw', { kw });
        } else if (query.filter === 'artist') {
          queryBuilder.where('track.artistName ILIKE :kw', { kw });
        } else if (query.filter === 'album') {
          queryBuilder.where('track.albumTitle ILIKE :kw', { kw });
        } else {
          queryBuilder.where(
            '(track.title ILIKE :kw OR track.albumTitle ILIKE :kw OR track.artistName ILIKE :kw)',
            { kw },
          );
        }
      }

      // 3. Đo thời gian thực tế chạy Query
      const startTime = performance.now();

      [results, total] = await queryBuilder
        .orderBy('track.id', 'ASC')
        .skip((p - 1) * l)
        .take(l)
        .getManyAndCount();

      const endTime = performance.now();
      executionTimeMs = endTime - startTime;
    });

    // 4. Trả về Response
    return {
      data: results,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
        limit: l,
      },
      benchmark: {
        // Nếu dùng index, gán thời gian vào fast_query. Nếu bypass, gán vào slow_query.
        fast_query_time_ms: !isBypass ? Math.round(executionTimeMs) : 0,
        slow_query_time_ms: isBypass ? Math.round(executionTimeMs) : null,
        diff_factor: 1,
      },
    };
  }
}
