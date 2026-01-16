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

    // findAndCount giúp FE biết tổng số trang để phân trang
    const [results, total] = await this.trackRepo.findAndCount({
      take: l,
      skip: (p - 1) * l,
      order: { id: 'ASC' },
      // Đảm bảo lấy các cột đã phi chuẩn hóa để FE không bị "No data"
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

  // --- API 3: SEARCH SMART (Đã fix để khớp với FE pagination) ---
  @Get('search-smart')
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const keyword = q ? q.trim() : '';
    const l = Number(limit) || 20;
    const p = Number(page) || 1;

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

    return {
      data: results,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
        limit: l,
      },
    };
  }

  // Các API khác giữ nguyên bên trong class...
}
