// modules/seeder/seeder.service.ts
// TypeScript Type Inference (Suy luận kiểu dữ liệu)
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Track } from '../../entities/track.entity';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { faker } from '@faker-js/faker';

// Định nghĩa Interface để tránh lỗi "never"
interface AlbumSeederData {
  title: string;
  releaseYear: number;
  bitDepth: 16 | 24;
  sampleRate: number;
  coverPath: string;
  artist: { id: any };
  folderName: string; // Dùng tạm để tạo path cho track
  artistName: string; // Dùng tạm để tạo path cho track
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  private seedingState = {
    progress: 0,
    isSeeding: false,
    total: 0,
    current: 0,
  };

  constructor(
    @InjectRepository(Track) private trackRepo: Repository<Track>,
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    private dataSource: DataSource,
  ) {}

  getProgress() {
    return this.seedingState;
  }

  async seed(limit: number = 1000000) {
    if (this.seedingState.isSeeding) return { message: 'Đang chạy rồi!' };

    this.seedingState = {
      progress: 0,
      isSeeding: true,
      total: limit,
      current: 0,
    };

    const ARTISTS_PER_CHUNK = 100;
    let totalTracksCreated = 0;

    try {
      this.logger.log(`🚀 Bắt đầu seeding ${limit} bài hát...`);

      while (totalTracksCreated < limit) {
        await this.dataSource.transaction(async (manager) => {
          // FIX: Khai báo kiểu dữ liệu rõ ràng thay vì để mặc định []
          const artistsData: Partial<Artist>[] = [];

          for (let i = 0; i < ARTISTS_PER_CHUNK; i++) {
            artistsData.push({
              name: faker.person.fullName(),
              picturePath: `artists/covers/${faker.string.uuid()}.jpg`,
            });
          }

          // Lọc trùng trong BATCH hiện tại
          // Sử dụng Map để giữ lại duy nhất 1 bản ghi cho mỗi "name"
          const uniqueArtistsMap = new Map<string, Partial<Artist>>();
          artistsData.forEach((artist) => {
            uniqueArtistsMap.set(artist.name!, artist);
          });
          const filteredArtistsData = Array.from(uniqueArtistsMap.values());

          const savedArtists = await manager
            .createQueryBuilder()
            .insert()
            .into(Artist)
            .values(filteredArtistsData)
            .onConflict('("name") DO UPDATE SET "name" = EXCLUDED."name"') // Vẫn nên giữ cái này để tránh trùng với các bản ghi cũ trong DB
            .returning(['id', 'name'])
            .execute();

          const albumsData: AlbumSeederData[] = []; // --------------------------------
          const artistMaps = savedArtists.generatedMaps;

          for (const artistRef of artistMaps) {
            const albumCount = faker.number.int({ min: 1, max: 2 });
            for (let j = 0; j < albumCount; j++) {
              const albumTitle = faker.music.album();
              const releaseYear = faker.number.int({ min: 1990, max: 2024 });
              const bitDepth = faker.helpers.arrayElement([16, 24]) as 16 | 24;
              const sampleRate = faker.helpers.arrayElement([44.1, 48.0, 96.0]);
              const folderName = `${artistRef.name} - ${albumTitle} (${releaseYear}) [${bitDepth}B-${sampleRate}kHz]`;

              albumsData.push({
                title: albumTitle,
                releaseYear,
                bitDepth,
                sampleRate,
                coverPath: `${artistRef.name}/${folderName}/cover.jpg`,
                artist: { id: artistRef.id },
                folderName: folderName,
                artistName: artistRef.name,
              });
            }
          }

          // FIX: Tách meta data ra trước khi insert vào DB
          const albumsToInsert = albumsData.map(
            ({ folderName, artistName, ...rest }) => rest,
          );

          const savedAlbums = await manager
            .createQueryBuilder()
            .insert()
            .into(Album)
            .values(albumsToInsert)
            .returning(['id'])
            .execute();

          const tracksData: Partial<Track>[] = [];
          const albumMaps = savedAlbums.generatedMaps;

          for (let i = 0; i < albumMaps.length; i++) {
            if (totalTracksCreated >= limit) break;

            const albumId = albumMaps[i].id;
            const meta = albumsData[i];
            const tracksPerAlbum = faker.number.int({ min: 4, max: 5 });

            for (let t = 1; t <= tracksPerAlbum; t++) {
              if (totalTracksCreated >= limit) break;

              const songTitle = faker.music.songName();
              const fileName = `${t.toString().padStart(2, '0')}. ${songTitle}.flac`;

              tracksData.push({
                title: songTitle,
                fileName: fileName,
                artistName: meta.artistName,
                albumTitle: meta.title,
                relativePath: `${meta.artistName}\\${meta.folderName}\\${fileName}`,
                trackNumber: t,
                duration: faker.number.int({ min: 180, max: 450 }),
                bitrate: meta.bitDepth === 24 ? 2116 : 1411,
                sampleRate: Math.round(meta.sampleRate * 1000),
                bitDepth: meta.bitDepth,
                extension: 'flac',
                fileSize: faker.number.int({ min: 20000000, max: 50000000 }),
                album: { id: albumId } as any,
                benchmarkOrder: totalTracksCreated,
                keyword: `key_${totalTracksCreated}`,
              });

              totalTracksCreated++;
            }
          }

          if (tracksData.length > 0) {
            await manager
              .createQueryBuilder()
              .insert()
              .into(Track)
              .values(tracksData)
              .execute();
          }

          this.updateProgress(totalTracksCreated, limit);
        });

        await new Promise((resolve) => setImmediate(resolve));
      }
    } catch (e) {
      this.logger.error('Lỗi khi seeding: ' + e.message);
      console.error(e);
    } finally {
      this.seedingState.isSeeding = false;
      this.logger.log(`✅ Hoàn tất! Đã tạo ${totalTracksCreated} bài hát.`);
    }
    return { count: totalTracksCreated };
  }

  private updateProgress(current: number, total: number) {
    this.seedingState.current = current;
    this.seedingState.progress = Math.min(
      Math.floor((current / total) * 100),
      100,
    );

    if (current % 5000 === 0 || current >= total) {
      this.logger.log(
        `⏳ Tiến độ: ${this.seedingState.progress}% (${current}/${total})`,
      );
    }
  }
}
