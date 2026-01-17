import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SeederService } from '../seeder/seeder.service';

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
    const targetCount = count ? Number(count) : 1000000;
    this.logger.debug(`🖱️ User requested seed: ${targetCount}`);

    // Gọi hàm seed (không await để trả về response ngay cho frontend polling)
    this.seederService.seed(targetCount);

    return { message: 'Seeding started', target: targetCount };
  }

  @Get('progress')
  @ApiOperation({ summary: 'Kiểm tra tiến độ' })
  async getProgress() {
    // ✅ Giờ thì hàm này đã tồn tại bên Service
    return this.seederService.getProgress();
  }

  // RESTful API để lấy báo cáo hiệu suất truy vấn

  @Get('report')
  @ApiOperation({ summary: 'Lấy báo cáo hiệu suất truy vấn' })
  async getPerformanceReport() {
    const startTime = Date.now();

    // Thực hiện các truy vấn mẫu để đo hiệu suất
    const stats = await this.seederService.getDatabaseStats();

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      timestamp: new Date().toISOString(),
      executionTimeMs: duration,
      dataSummary: stats,
      status: 'Success',
    };
  }
}
