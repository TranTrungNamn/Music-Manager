import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SearchFilter {
  ALL = 'all',
  TRACK = 'track',
  ARTIST = 'artist',
  ALBUM = 'album',
}

// ====================================================================
// 1. SEARCH REQUEST DTO (Dùng để nhận tham số từ Swagger)
// ====================================================================
export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (để trống nếu muốn lấy tất cả)',
    example: 'Love',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: SearchFilter,
    default: SearchFilter.ALL,
    description: 'Trường muốn tìm kiếm',
  })
  @IsOptional()
  @IsEnum(SearchFilter)
  filter?: SearchFilter = SearchFilter.ALL;

  @ApiPropertyOptional({ example: 1, description: 'Số trang' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Số lượng kết quả trên mỗi trang',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  // 👇 ĐÂY LÀ PHẦN MỚI THÊM VÀO ĐỂ BẬT TẮT INDEX
  @ApiPropertyOptional({
    description:
      'Bật (true) để BỎ QUA INDEX (chạy chậm). Tắt (false) để DÙNG INDEX (chạy nhanh).',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true) // Ép kiểu từ query param sang boolean
  bypassIndex?: boolean = false;
}

// ====================================================================
// 2. RESPONSE DTOs (Giữ nguyên như cũ)
// ====================================================================

export class SeederProgressDto {
  @ApiProperty({ example: 45, description: 'Percentage of completion' })
  progress: number;

  @ApiProperty({ example: true, description: 'Is seeder currently running?' })
  isSeeding: boolean;

  @ApiProperty({
    example: 450000,
    description: 'Current count of records seeded',
  })
  current: number;

  @ApiProperty({ example: 1000000, description: 'Total records to seed' })
  total: number;
}

export class DatabaseStatsDto {
  @ApiProperty({ example: 1000000, description: 'Total tracks in DB' })
  tracks: number;

  @ApiProperty({ example: 50000, description: 'Total albums in DB' })
  albums: number;

  @ApiProperty({ example: 10000, description: 'Total artists in DB' })
  artists: number;
}

export class BenchmarkMetaDto {
  @ApiProperty({ example: 1000000, description: 'Total records found' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 50000, description: 'Last page number' })
  lastPage: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;
}

export class BenchmarkResultDto {
  @ApiProperty({
    example: 12.345,
    description:
      'Execution time of the optimized query in milliseconds (Database Execution Time)',
  })
  fast_query_time_ms: number;

  @ApiProperty({
    example: 450.123,
    description:
      'Execution time of the slow query in milliseconds (null if no keyword provided)',
    nullable: true,
  })
  slow_query_time_ms: number | null;

  @ApiProperty({
    example: 36.5,
    description: 'Performance difference factor (Slow / Fast)',
  })
  diff_factor: number;
}

export class BenchmarkResponseDto {
  @ApiProperty({ description: 'List of track results', isArray: true })
  data: any[];

  @ApiProperty({ type: BenchmarkMetaDto, description: 'Pagination metadata' })
  meta: BenchmarkMetaDto;

  @ApiProperty({
    type: BenchmarkResultDto,
    description: 'Benchmark performance result',
  })
  benchmark: BenchmarkResultDto;
}
