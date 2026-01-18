import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from '../../entities/track.entity';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Tracks & Library') // Đổi tên tag cho hợp lý
@Controller()
export class MusicController {
  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
  ) {}

  // --- API: LẤY DANH SÁCH (LIBRARY) ---
  @Get('tracks')
  @ApiOperation({ summary: 'Lấy danh sách bài hát (Library)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
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
      total,
      page: p,
      lastPage: Math.ceil(total / l),
    };
  }

  // --- API: STATS ---
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan' })
  async getStats() {
    const [tracks, artists, albums] = await Promise.all([
      this.trackRepo.count(),
      this.artistRepo.count(),
      this.albumRepo.count(),
    ]);
    return { tracks, artists, albums };
  }
}
