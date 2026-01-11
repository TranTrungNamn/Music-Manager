import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeederService } from './seeder.service';

@ApiTags('benchmark')
@Controller('benchmark')
export class BenchmarkController {
  // Khởi tạo Logger để ghi lại các "nút bấm"
  private readonly logger = new Logger('BENCHMARK-CONTROLLER');

  constructor(private readonly seederService: SeederService) {}

  @Get('seed')
  @ApiOperation({ summary: 'Bắt đầu quy trình đổ dữ liệu mẫu (Seeding)' })
  async seed() {
    console.log('\n');
    this.logger.debug('🖱️ [HÀNH ĐỘNG]: Người dùng nhấn nút SEED');

    // Đảm bảo trong SeederService bạn có hàm tên là "seed"
    const result = await this.seederService.seed();

    this.logger.log('✅ [HOÀN TẤT]: Quy trình Seed đã xong');
    console.log('\n');
    return result;
  }

  @Get('progress')
  @ApiOperation({ summary: 'Kiểm tra tiến độ đổ dữ liệu' })
  async getProgress() {
    console.log('\n');
    this.logger.debug('🖱️ [HÀNH ĐỘNG]: Người dùng nhấn nút CHECK PROGRESS');

    // Giữ nguyên tính năng lấy tiến độ của bạn
    const progress = await this.seederService.getProgress();

    this.logger.verbose(`📊 Tiến độ hiện tại: ${progress}%`);
    console.log('\n');
    return progress;
  }

  @Get('compare')
  @ApiOperation({ summary: 'So sánh hiệu năng giữa các phương thức' })
  async compare() {
    console.log('\n');
    this.logger.debug('🖱️ [HÀNH ĐỘNG]: Người dùng nhấn nút COMPARE');

    // Giữ nguyên tính năng so sánh của bạn
    const report = await this.seederService.compare();

    this.logger.log('📋 Đã xuất báo cáo so sánh hiệu năng');
    console.log('\n');
    return report;
  }
}
