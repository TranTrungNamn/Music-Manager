import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { Track } from '../../entities/track.entity';
import { BenchmarkResponseDto } from './benchmark.dto';

@ApiTags('Benchmark & Performance Testing')
@Controller('benchmark')
export class BenchmarkController {
  constructor(@InjectRepository(Track) private trackRepo: Repository<Track>) {}

  @Get('search')
  @ApiOperation({
    summary: 'So sánh hiệu năng tìm kiếm (Luôn bật báo cáo)',
    description:
      'API này thực hiện tìm kiếm bài hát và **LUÔN LUÔN** so sánh hiệu năng giữa: \n\n 1. **Fast Query**: Sử dụng Index & QueryBuilder (Tối ưu). \n 2. **Slow Query**: Giả lập Full Table Scan (Chưa tối ưu) để lấy số liệu so sánh.',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả tìm kiếm kèm báo cáo hiệu năng',
    type: BenchmarkResponseDto,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Từ khóa tìm kiếm',
    example: 'Love',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'title', 'artist', 'album'],
    description: 'Trường dữ liệu cần tìm',
    example: 'all',
  })
  // [ĐÃ XÓA] ApiQuery benchmark
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    // [ĐÃ XÓA] tham số benchmark
  ): Promise<BenchmarkResponseDto> {
    const keyword = q ? q.trim() : '';
    const l = Number(limit) || 20;
    const p = Number(page) || 1;

    // ======================================================
    // 1. FAST QUERY (Luôn chạy để lấy dữ liệu hiển thị)
    // ======================================================
    const startFast = performance.now();
    const queryBuilder = this.trackRepo.createQueryBuilder('track').select([
      'track.id',
      'track.title',
      'track.duration',
      'track.albumTitle',
      'track.artistName',
      // 'track.createdAt', // Bỏ comment nếu cần
    ]);

    if (keyword) {
      const kw = `%${keyword}%`;
      if (filter === 'title')
        queryBuilder.where('track.title ILIKE :kw', { kw });
      else if (filter === 'artist')
        queryBuilder.where('track.artistName ILIKE :kw', { kw });
      else if (filter === 'album')
        queryBuilder.where('track.albumTitle ILIKE :kw', { kw });
      else
        queryBuilder.where(
          '(track.title ILIKE :kw OR track.albumTitle ILIKE :kw OR track.artistName ILIKE :kw)',
          { kw },
        );
    }

    const [results, total] = await queryBuilder
      .orderBy('track.id', 'ASC') // Hoặc sort theo tiêu chí khác
      .skip((p - 1) * l)
      .take(l)
      .getManyAndCount();

    const endFast = performance.now();
    const fastTime = endFast - startFast;

    // ======================================================
    // 2. SLOW QUERY (LUÔN CHẠY khi có từ khóa)
    // ======================================================
    let slowTime = 0;
    let slowExplanation = 'N/A (No keyword provided)';

    // Chỉ cần có keyword là chạy đo lường, không cần check flag true/false
    if (keyword) {
      const startSlow = performance.now();

      // Câu lệnh này cố tình viết để không dùng Index (Full Scan)
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
        is_active: true, // Luôn luôn là true
        fast_query_time: `${fastTime.toFixed(2)} ms`,
        slow_query_time: slowTime > 0 ? `${slowTime.toFixed(2)} ms` : 'N/A',
        // Tính hệ số chênh lệch
        diff_factor: slowTime > 0 ? (slowTime / fastTime).toFixed(1) : '0',
        explanation: {
          fast: 'ORM Query Builder (Optimized)',
          slow: slowExplanation,
        },
      },
    };
  }
}
