import { Controller, Get, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
  ) {}

  @Get('artists')
  async getAllArtists() {
    console.log('\n🔍 [BACKEND]: Đang truy vấn danh sách Artist từ Neon...');
    const data = await this.artistRepo.find();

    // Đảm bảo trả về mảng, nếu không có thì trả về mảng rỗng []
    const result = data || [];
    this.logger.log(`✅ [BACKEND]: Trả về ${result.length} artists`);
    return result;
  }
}
