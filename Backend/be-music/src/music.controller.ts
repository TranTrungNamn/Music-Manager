import { Controller, Get, Query, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Track } from './entities/track.entity';
import { performance } from 'perf_hooks';

@Controller('music')
export class MusicController {
  private readonly logger = new Logger('MUSIC-API');

  constructor(@InjectRepository(Track) private trackRepo: Repository<Track>) {}

  @Get('search-smart')
  async searchSmart(@Query('q') q: string) {
    const keyword = q ? q.trim() : '';
    this.logger.log(`🔍 [SEARCH]: Test hiệu năng với keyword "${keyword}"`);

    // Lấy số ID để test (nếu user nhập số, hoặc mặc định 900.000)
    const matchId = keyword.match(/(\d+)/);
    const testId = matchId ? parseInt(matchId[0]) : 900000;

    // 1. QUERY NHANH (Index Scan)
    // Tìm chính xác bài có Title bắt đầu bằng "Track #900000"
    // Vì cột 'title' có @Index(), DB sẽ nhảy cóc tới ngay bản ghi đó.
    const t1 = performance.now();
    await this.trackRepo.findOne({
      where: { title: Like(`Track #${testId}%`) }, // Cú pháp Like để tìm prefix
    });
    const fastTime = performance.now() - t1;

    // 2. QUERY CHẬM (Full Table Scan)
    // Tìm bài có benchmarkOrder = 900000
    // Vì cột 'benchmarkOrder' KHÔNG có Index, DB phải lật từng trang sách (scan 1 triệu dòng) để tìm.
    const t2 = performance.now();
    await this.trackRepo.findOne({
      where: { benchmarkOrder: testId },
    });
    const slowTime = performance.now() - t2;

    // Lấy dữ liệu hiển thị (Top 20 bài mới nhất)
    const results = await this.trackRepo.find({
      take: 20,
      order: { createdAt: 'DESC' },
    });

    return {
      data: results,
      benchmark: {
        testId_used: testId,
        fast_query_time: fastTime.toFixed(4) + ' ms',
        slow_query_time: slowTime.toFixed(4) + ' ms',
        diff_factor: (slowTime / (fastTime || 0.01)).toFixed(1) + 'x',
        explanation: {
          fast: `Tìm theo cột Title (Indexed): Like 'Track #${testId}%'`,
          slow: `Tìm theo cột BenchmarkOrder (No Index): = ${testId}`,
        },
      },
    };
  }
}
