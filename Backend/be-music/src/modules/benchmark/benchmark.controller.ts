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
  // 1. DATA SEEDING ENDPOINTS
  // ======================================================

  @Post('seed')
  @ApiOperation({
    summary: 'Execute Data Seeder',
    description: 'Generates large-scale mock data for performance testing.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 1000000,
    description: 'Number of track records to generate (Default: 1,000,000)',
  })
  async runSeeder(@Query('limit') limit: number = 1000000) {
    return this.seederService.seed(Number(limit));
  }

  @Get('seed/progress')
  @ApiOperation({
    summary: 'Get Seeder Progress',
    description:
      'Retrieves the current progress of the data generation process.',
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
    summary: 'Database Statistics',
    description:
      'Retrieves total counts of Tracks, Artists, and Albums in the database. Used to verify the dataset size before benchmarking.',
  })
  @ApiResponse({
    status: 200,
    type: DatabaseStatsDto,
  })
  async getDatabaseStats() {
    return this.seederService.getDatabaseStats();
  }

  // ======================================================
  // 2. SEARCH & BENCHMARK API
  // ======================================================

  @Get('search')
  @ApiOperation({
    summary: 'Search & Performance Comparison (EXPLAIN ANALYZE)',
    description:
      'Search API that automatically executes two queries (Optimized Index Scan vs Full Table Scan) to compare database execution time.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results alongside database benchmark report',
    type: BenchmarkResponseDto,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description:
      'Search keyword (required to trigger the unoptimized slow query)',
    example: 'Love',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'track', 'artist', 'album'],
    description: 'Field to apply search criteria',
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

    // --- STEP 1: FETCH ACTUAL DATA ---
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
      if (filter === 'track') {
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

    // --- STEP 2: MEASURE FAST QUERY (DB-Side Execution Time) ---
    let dbFastTime = 0;
    try {
      const [fastSql, fastParams] = queryBuilder.getQueryAndParameters();
      const fastExplain = await this.trackRepo.query(
        `EXPLAIN (ANALYZE, FORMAT JSON) ${fastSql}`,
        fastParams,
      );
      dbFastTime = fastExplain[0]['QUERY PLAN'][0]['Execution Time'];
    } catch (e) {
      console.error('Fast Query Explain Error:', e);
    }

    // --- STEP 3: MEASURE SLOW QUERY (Unoptimized Full Scan) ---
    let dbSlowTime = 0;
    let slowExplanation = 'N/A (No keyword provided)';

    if (keyword) {
      try {
        const slowKw = `%${keyword.toLowerCase()}%`;
        const slowSql = `
          SELECT COUNT(*) FROM tracks 
          WHERE lower(title) LIKE $1 
          OR lower("artistName") LIKE $1 
          OR lower("albumTitle") LIKE $1
        `;

        const slowExplain = await this.trackRepo.query(
          `EXPLAIN (ANALYZE, FORMAT JSON) ${slowSql}`,
          [slowKw],
        );
        dbSlowTime = slowExplain[0]['QUERY PLAN'][0]['Execution Time'];
        slowExplanation = 'Full Table Scan (Raw SQL EXPLAIN ANALYZE)';
      } catch (e) {
        console.error('Slow Query Explain Error:', e);
      }
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
        // Trả về số liệu thuần
        fast_query_time_ms: dbFastTime,

        // Trả về số liệu gốc của slow query (nếu có)
        slow_query_time_ms: dbSlowTime > 0 ? dbSlowTime : null,

        // Hệ số chênh lệch thuần túy
        diff_factor: dbSlowTime > 0 ? dbSlowTime / dbFastTime : 0,
      },
    };
  }
}
