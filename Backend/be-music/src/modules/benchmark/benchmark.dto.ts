import { ApiProperty } from '@nestjs/swagger';
import { Track } from '../../entities/track.entity';

// ==========================================
// A. CÁC DTO CHO SEARCH & BENCHMARK
// ==========================================

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
    description: 'Thời gian chạy câu lệnh chậm (giả lập)',
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

// ==========================================
// B. CÁC DTO CHO SEEDER (MỚI THÊM)
// ==========================================

export class SeederProgressDto {
  @ApiProperty({ example: 45, description: 'Tiến độ phần trăm (0-100)' })
  progress: number;

  @ApiProperty({ example: true, description: 'Đang chạy hay không' })
  isSeeding: boolean;

  @ApiProperty({ example: 100000, description: 'Tổng số bản ghi cần tạo' })
  total: number;

  @ApiProperty({ example: 45000, description: 'Số bản ghi hiện tại' })
  current: number;
}

export class DatabaseStatsDto {
  @ApiProperty({ example: 1000000 })
  totalTracks: number;

  @ApiProperty({ example: 5000 })
  totalArtists: number;

  @ApiProperty({ example: 8000 })
  totalAlbums: number;

  @ApiProperty({ example: '2024-01-26T10:00:00Z' })
  updatedAt: string;
}
