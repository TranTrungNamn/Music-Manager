import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenchmarkController } from './benchmark.controller';
import { Track } from '../../entities/track.entity';
import { Album } from '../../entities/album.entity';
import { Artist } from '../../entities/artist.entity';
import { SeederModule } from '../seeder/seeder.module';

/**
 * BenchmarkModule
 * Chịu trách nhiệm quản lý các tính năng kiểm thử hiệu năng (Benchmarking)
 * và xử lý dữ liệu giả (Seeding) phục vụ cho việc test hệ thống.
 */
@Module({
  imports: [
    // Đăng ký các Entities vào TypeORM để có thể sử dụng các Repository (TrackRepository, v.v.)
    // phục vụ cho việc chạy Fast Query và Slow Query trong Controller.
    TypeOrmModule.forFeature([Track, Album, Artist]),

    // Import SeederModule để có thể sử dụng SeederService
    // Giúp Controller gọi được các hàm seed dữ liệu và lấy thống kê DB.
    SeederModule,
  ],
  controllers: [
    // Khai báo Controller xử lý các route bắt đầu bằng /benchmark
    BenchmarkController,
  ],
  // providers: [] // Hiện tại không có Service riêng cho module này vì logic nằm ở Controller và SeederService
})
export class BenchmarkModule {}
