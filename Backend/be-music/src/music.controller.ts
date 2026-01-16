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

  // --- API 1: STATS (Tối ưu) ---
  @Get('stats')
  async getStats() {
    const [tracks, artists, albums] = await Promise.all([
      this.trackRepo.count(),
      this.artistRepo.count(),
      this.albumRepo.count(),
    ]);
    return { tracks, artists, albums };
  }

  // --- API 2: LẤY DANH SÁCH NGHỆ SĨ (Chỉ lấy cột cần thiết) ---
  @Get('artists')
  async getArtists() {
    return this.artistRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  // --- API 3: LẤY DANH SÁCH ALBUM (Fix lỗi type string -> number) ---
  @Get('albums')
  async getAlbums(@Query('artistId') artistId?: string) {
    const query = this.albumRepo
      .createQueryBuilder('album')
      .leftJoin('album.artist', 'artist')
      .select([
        'album.id',
        'album.title',
        'album.releaseYear',
        'artist.id',
        'artist.name',
      ]);

    if (artistId) {
      // Fix lỗi: Chuyển string sang number
      query.where('artist.id = :artistId', { artistId: Number(artistId) });
    }

    return query.orderBy('album.releaseYear', 'DESC').getMany();
  }

  // --- API 4: TRACKS THEO ALBUM (Projection: Chỉ lấy 5 cột) ---
  @Get('tracks-by-album')
  async getTracksByAlbum(@Query('albumId') albumId: string) {
    return (
      this.trackRepo
        .createQueryBuilder('track')
        .leftJoin('track.album', 'album')
        .select([
          'track.id',
          'track.title',
          'track.trackNumber',
          'track.duration',
          'album.id',
        ])
        // Fix lỗi: Chuyển string sang number
        .where('track.albumId = :albumId', { albumId: Number(albumId) })
        .orderBy('track.trackNumber', 'ASC')
        .getMany()
    );
  }

  // --- API 5: SEARCH SMART ---
  @Get('search-smart')
  async searchSmart(
    @Query('q') q: string,
    @Query('filter') filter: string = 'all',
    @Query('limit') limit: number = 20,
    @Query('lastId') lastId?: string,
  ) {
    const keyword = q ? q.trim() : '';
    const l = Number(limit) || 20;

    const queryBuilder = this.trackRepo
      .createQueryBuilder('track')
      // ĐÃ FIX: Lấy trực tiếp từ 'track' vì đã phi chuẩn hóa, không cần alias bảng khác
      .select([
        'track.id',
        'track.title',
        'track.duration',
        'track.albumTitle', // Lấy từ track.entity.ts
        'track.artistName', // Lấy từ track.entity.ts
      ]);

    // Xử lý logic tìm kiếm
    if (keyword) {
      // ĐÃ FIX: Chuỗi keyword đúng định dạng cho ILIKE
      const kw = `%${keyword}%`;

      if (filter === 'title') {
        queryBuilder.where('track.title ILIKE :kw', { kw });
      } else if (filter === 'artist') {
        // ĐÃ FIX: Dùng track.artistName thay vì artist.name
        queryBuilder.where('track.artistName ILIKE :kw', { kw });
      } else if (filter === 'album') {
        // ĐÃ FIX: Dùng track.albumTitle thay vì album.title
        queryBuilder.where('track.albumTitle ILIKE :kw', { kw });
      } else {
        // ĐÃ FIX: Đồng bộ tất cả về bảng track
        queryBuilder.where(
          '(track.title ILIKE :kw OR track.albumTitle ILIKE :kw OR track.artistName ILIKE :kw)',
          { kw },
        );
      }
    }

    // Keyset Pagination
    if (lastId) {
      queryBuilder.andWhere('track.id > :lastId', { lastId: Number(lastId) });
    }

    const results = await queryBuilder
      .orderBy('track.id', 'ASC')
      .take(l)
      .getMany();

    return {
      data: results,
      meta: {
        limit: l,
        lastId: results.length > 0 ? results[results.length - 1].id : null,
        hasMore: results.length === l,
      },
    };
  }
}
