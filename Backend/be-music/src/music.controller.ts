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

  // --- API 1: STATS ---
  @Get('stats')
  async getStats() {
    const tracks = await this.trackRepo.count();
    const artists = await this.trackRepo.manager.count(Artist);
    const albums = await this.trackRepo.manager.count(Album);
    return { tracks, artists, albums };
  }

  // --- API 2: LẤY DANH SÁCH NGHỆ SĨ ---
  @Get('artists')
  async getArtists() {
    // Lấy tất cả nghệ sĩ, sắp xếp tên A-Z
    return this.trackRepo.manager.find(Artist, {
      order: { name: 'ASC' },
      // relations: ['albums'] // Nếu muốn hiển thị số album thì bật cái này (nhưng sẽ nặng)
    });
  }

  // --- API 3: LẤY DANH SÁCH ALBUM ---
  @Get('albums')
  async getAlbums(@Query('artistId') artistId: string) {
    const whereCondition = artistId ? { artist: { id: artistId } } : {};

    return this.trackRepo.manager.find(Album, {
      where: whereCondition,
      relations: ['artist'],
      order: { releaseYear: 'DESC' },
    });
  }

  // --- API 4: LẤY TRACKS (CỦA ALBUM HOẶC TẤT CẢ) ---
  @Get('tracks-by-album')
  async getTracksByAlbum(@Query('albumId') albumId: string) {
    return this.trackRepo.find({
      where: { album: { id: albumId } },
      order: { trackNumber: 'ASC' }, // Sắp xếp theo thứ tự bài trong album
      relations: ['album', 'album.artist'],
    });
  }

  // --- API CŨ: SEARCH SMART (Giữ nguyên để Search hoạt động) ---
  @Get('search-smart')
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const keyword = q ? q.trim() : '';
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;

    let whereCondition: any[] = [];
    const term = Like(`%${keyword}%`);

    if (filter === 'title') whereCondition = [{ title: term }];
    else if (filter === 'artist')
      whereCondition = [{ album: { artist: { name: term } } }];
    else if (filter === 'album') whereCondition = [{ album: { title: term } }];
    else
      whereCondition = [
        { title: term },
        { album: { title: term } },
        { album: { artist: { name: term } } },
      ];

    // Warmup & Benchmark (Optional - Giữ lại logic cũ)
    let benchmarkData: any = null;
    if (p === 1 && filter === 'all') {
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
      };
    }

    const [results, total] = await this.trackRepo.findAndCount({
      where: whereCondition,
      take: l,
      skip: skip,
      relations: ['album', 'album.artist'],
      order: { title: 'ASC' },
    });

    return {
      data: results,
      meta: { total, page: p, lastPage: Math.ceil(total / l) },
      benchmark: benchmarkData,
    };
  }
}
