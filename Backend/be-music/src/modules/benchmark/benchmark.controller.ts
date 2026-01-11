import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SeederService } from './seeder.service';

@ApiTags('benchmark')
@Controller('benchmark')
export class BenchmarkController {
  private readonly logger = new Logger('BENCHMARK-CONTROLLER');

  constructor(private readonly seederService: SeederService) {}

  @Get('seed')
  @ApiOperation({ summary: 'Bắt đầu quy trình đổ dữ liệu mẫu' })
  @ApiQuery({
    name: 'count',
    required: false,
    description: 'Số lượng track muốn tạo (Mặc định 1 triệu)',
  })
  async seed(@Query('count') count?: number) {
    // Chuyển đổi sang number (vì query params luôn là string)
    const targetCount = count ? Number(count) : 1000000;

    console.log('\n');
    this.logger.debug(
      `🖱️ [ACTION]: Người dùng yêu cầu tạo ${targetCount.toLocaleString()} dòng dữ liệu`,
    );

    // Truyền số lượng vào service
    const result = await this.seederService.seed(targetCount);

    this.logger.log('✅ [DONE]: Yêu cầu Seed đã được tiếp nhận và xử lý');
    console.log('\n');
    return result;
  }

  @Get('progress')
  @ApiOperation({ summary: 'Kiểm tra tiến độ' })
  async getProgress() {
    return await this.seederService.getProgress();
  }

  @Get('compare')
  @ApiOperation({ summary: 'So sánh hiệu năng' })
  async compare() {
    return await this.seederService.compare();
  }
}
