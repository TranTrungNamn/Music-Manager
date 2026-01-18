import { ApiProperty } from '@nestjs/swagger';
import { Track } from '../../entities/track.entity';

// 1. Định nghĩa cấu trúc Benchmark
export class BenchmarkResultDto {
  @ApiProperty({ example: true, description: 'Trạng thái bật/tắt chế độ test' })
  is_active: boolean;

  @ApiProperty({
    example: '1.20 ms',
    description: 'Thời gian chạy câu lệnh tối ưu',
  })
  fast_query_time: string;

  @ApiProperty({
    example: '150.00 ms',
    description: 'Thời gian chạy câu lệnh chậm (nếu bật)',
  })
  slow_query_time: string;

  @ApiProperty({
    example: '125.0',
    description: 'Hệ số chênh lệch (Slow / Fast)',
  })
  diff_factor: string;

  @ApiProperty({
    example: { fast: 'ORM Query Builder', slow: 'Full Table Scan' },
    description: 'Giải thích kỹ thuật',
  })
  explanation: {
    fast: string;
    slow: string;
  };
}

// 2. Định nghĩa Meta phân trang
export class PaginationMetaDto {
  @ApiProperty({ example: 1000 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  lastPage: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

// 3. Định nghĩa Response tổng (Wrapper)
export class BenchmarkResponseDto {
  @ApiProperty({ type: [Track], description: 'Danh sách bài hát tìm được' })
  data: Track[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;

  @ApiProperty({
    type: BenchmarkResultDto,
    description: 'Kết quả đo lường hiệu năng',
  })
  benchmark: BenchmarkResultDto;
}
