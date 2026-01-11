import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../../entities/artist.entity';
import { Album } from '../../entities/album.entity';
import { Track } from '../../entities/track.entity';
import { faker } from '@faker-js/faker';

@Injectable()
export class SeederService {
  private readonly logger = new Logger('SEEDER-LOG');

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Track) private trackRepo: Repository<Track>,
  ) {}

  // Phải có hàm seed này để Controller gọi tới
  async seed() {
    console.log('\n');
    this.logger.debug('🚀 Bắt đầu quy trình Seeding dữ liệu...');

    // 1. Tạo Artist
    this.logger.verbose('--- Đang tạo danh sách Nghệ sĩ (Artists) ---');
    const artist = this.artistRepo.create({
      name: faker.person.fullName(),
    });
    await this.artistRepo.save(artist);
    this.logger.log(`✅ Đã lưu Artist: ${artist.name}`);
    console.log('\n');

    // 2. Tạo Album
    this.logger.verbose('--- Đang tạo Album cho nghệ sĩ ---');
    const album = this.albumRepo.create({
      title: faker.music.songName(),
      artist: artist,
    });
    await this.albumRepo.save(album);
    this.logger.log(`✅ Đã lưu Album: ${album.title}`);
    console.log('\n');

    this.logger.debug('✨ Hoàn tất toàn bộ quy trình Seed dữ liệu!');
    console.log('\n');

    return { success: true, message: 'Data seeded successfully' };
  }

  async getProgress() {
    // Logic của bạn ở đây
  }

  async compare() {
    // Logic của bạn ở đây
  }
}
