import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Track } from '../../entities/track.entity';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { faker } from '@faker-js/faker';
import { SEEDER_VOCABULARY } from './constants/vocabulary.contants';

interface AlbumSeederData {
  title: string;
  releaseYear: number;
  bitDepth: 16 | 24;
  sampleRate: number;
  coverPath: string;
  artist: { id: any };
  folderName: string;
  artistName: string;
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

  /**
   * Generates a guaranteed unique title based on the current index
   * using Cartesian Product logic from the vocabulary constant.
   */
  private generateUniqueTitle(index: number): string {
    const { adjectives, nouns, contexts } = SEEDER_VOCABULARY;

    // Ensure we don't exceed the vocabulary bounds and maintain uniqueness
    const adjIndex =
      Math.floor(index / (nouns.length * contexts.length)) % adjectives.length;
    const nounIndex = Math.floor(index / contexts.length) % nouns.length;
    const ctxIndex = index % contexts.length;

    const adj = adjectives[adjIndex] || 'Unique';
    const noun = nouns[nounIndex] || 'Track';
    const ctx = contexts[ctxIndex] || `no. ${index}`;

    return `${adj} ${noun} ${ctx}`;
  }

  async seed(limit: number = 1000000) {
    if (this.seedingState.isSeeding) {
      return { message: 'Seeding process is already in progress.' };
    }

    this.seedingState = {
      progress: 0,
      isSeeding: true,
      total: limit,
      current: 0,
    };
    const ARTISTS_PER_CHUNK = 100;
    let totalTracksCreated = 0;

    try {
      this.logger.log(`Starting database seeding: Target ${limit} tracks.`);

      while (totalTracksCreated < limit) {
        await this.dataSource.transaction(async (manager) => {
          // 1. Generate Batch of Artists
          const artistsData: Partial<Artist>[] = [];
          for (let i = 0; i < ARTISTS_PER_CHUNK; i++) {
            artistsData.push({
              name: `${faker.person.fullName()} ${faker.string.alphanumeric(4)}`,
              picturePath: `artists/covers/${faker.string.uuid()}.jpg`,
            });
          }

          const savedArtists = await manager
            .createQueryBuilder()
            .insert()
            .into(Artist)
            .values(artistsData)
            .onConflict('("name") DO UPDATE SET "updatedAt" = NOW()')
            .returning(['id', 'name'])
            .execute();

          // 2. Generate Albums for saved Artists
          const albumsData: AlbumSeederData[] = [];
          for (const artistRef of savedArtists.generatedMaps) {
            const albumTitle = `${faker.music.album()} ${faker.string.alphanumeric(3)}`;
            const releaseYear = faker.number.int({ min: 1990, max: 2025 });
            const bitDepth = faker.helpers.arrayElement([16, 24]) as 16 | 24;
            const sampleRate = faker.helpers.arrayElement([44.1, 48.0, 96.0]);

            albumsData.push({
              title: albumTitle,
              releaseYear,
              bitDepth,
              sampleRate,
              coverPath: `covers/${faker.string.uuid()}.jpg`,
              artist: { id: artistRef.id },
              folderName: `${artistRef.name} - ${albumTitle}`,
              artistName: artistRef.name,
            });
          }

          const savedAlbums = await manager
            .createQueryBuilder()
            .insert()
            .into(Album)
            .values(
              albumsData.map(({ folderName, artistName, ...rest }) => rest),
            )
            .returning(['id'])
            .execute();

          // 3. Generate Tracks for saved Albums
          const tracksData: Partial<Track>[] = [];
          for (let i = 0; i < savedAlbums.generatedMaps.length; i++) {
            const albumId = savedAlbums.generatedMaps[i].id;
            const meta = albumsData[i];
            const tracksPerAlbum = 10;

            for (let t = 1; t <= tracksPerAlbum; t++) {
              if (totalTracksCreated >= limit) break;

              const songTitle = this.generateUniqueTitle(totalTracksCreated);
              const fileName = `${t.toString().padStart(2, '0')}. ${songTitle}.flac`;

              tracksData.push({
                title: songTitle,
                fileName,
                artistName: meta.artistName,
                albumTitle: meta.title,
                relativePath: `${meta.artistName}/${meta.folderName}/${fileName}`,
                trackNumber: t,
                duration: faker.number.int({ min: 150, max: 400 }),
                bitrate: meta.bitDepth === 24 ? 2116 : 1411,
                sampleRate: Math.round(meta.sampleRate * 1000),
                bitDepth: meta.bitDepth,
                extension: 'flac',
                fileSize: faker.number.int({ min: 15000000, max: 60000000 }),
                album: { id: albumId } as any,
                benchmarkOrder: totalTracksCreated,
              });
              totalTracksCreated++;
            }
          }

          // 4. Final Batch Insert for Tracks
          if (tracksData.length > 0) {
            await manager.insert(Track, tracksData);
          }

          this.updateProgress(totalTracksCreated, limit);
        });
      }
    } catch (error) {
      this.logger.error(`Seeding interrupted: ${error.message}`);
    } finally {
      this.seedingState.isSeeding = false;
      this.logger.log(
        `Seeding process finished. Total tracks created: ${totalTracksCreated}`,
      );
    }

    return { count: totalTracksCreated };
  }

  private updateProgress(current: number, total: number) {
    this.seedingState.current = current;
    this.seedingState.progress = Math.min(
      Math.floor((current / total) * 100),
      100,
    );

    if (current % 5000 === 0 || current === total) {
      this.logger.log(
        `Seeding Progress: ${this.seedingState.progress}% (${current}/${total})`,
      );
    }
  }

  getProgress() {
    return this.seedingState;
  }
}
