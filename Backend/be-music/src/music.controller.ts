import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Artist } from './entities/artist.entity';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(
    @InjectRepository(Artist) private artistRepo: Repository<Artist>,
  ) {}

  // Lấy danh sách + Tìm kiếm
  @Get('artists')
  async getAllArtists(@Query('search') search?: string) {
    this.logger.log(
      `🔍 [BACKEND]: Đang truy vấn danh sách Artist (Search: ${search || 'None'})...`,
    );

    const options = search
      ? {
          where: { name: Like(`%${search}%`) },
          order: { name: 'ASC' as const },
        }
      : { order: { name: 'ASC' as const } };

    const data = await this.artistRepo.find(options);
    return data || [];
  }

  // Thêm mới
  @Post('artists')
  async createArtist(@Body() body: { name: string }) {
    this.logger.log(`✨ [BACKEND]: Đang tạo nghệ sĩ mới: ${body.name}`);
    const artist = this.artistRepo.create(body);
    return await this.artistRepo.save(artist);
  }

  // Cập nhật
  @Patch('artists/:id')
  async updateArtist(@Param('id') id: string, @Body() body: { name: string }) {
    this.logger.log(
      `📝 [BACKEND]: Đang cập nhật ID ${id} thành tên mới: ${body.name}`,
    );
    await this.artistRepo.update(id, body);
    return { success: true };
  }

  // Xóa
  @Delete('artists/:id')
  async deleteArtist(@Param('id') id: string) {
    this.logger.warn(`🗑️ [BACKEND]: Đang xóa nghệ sĩ ID: ${id}`);
    await this.artistRepo.delete(id);
    return { success: true };
  }
}
