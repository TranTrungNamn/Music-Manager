import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

// 1. Import Entities
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { Genre } from './entities/genre.entity';

// 2. Import Controllers & Services
import { AppController } from './modules/app.controller';
import { MusicController } from './modules/music/music.controller';
import { FileManagerService } from './common/file-manager.service';

// 3. Import Modules
import { BenchmarkModule } from './modules/benchmark/benchmark.module';
import { SeederModule } from './modules/seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Kết nối Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // 'db' là tên service trong docker-compose.yml
        host: config.get<string>('DB_HOST', 'db'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'be_music'),
        // Liệt kê trực tiếp Class thay vì dùng chuỗi để tránh lỗi Syntax
        entities: [Artist, Album, Track, Genre],
        synchronize: true,
        timezone: '+07:00',
        logging: false, // Tắt logging để tăng hiệu suất khi xử lý dữ liệu lớn
      }),
    }),

    TypeOrmModule.forFeature([Artist, Album, Track, Genre]),
    BenchmarkModule,
    SeederModule,
  ],
  controllers: [AppController, MusicController],
  providers: [FileManagerService],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  // Inject DataSource để có thể chạy raw SQL Query
  constructor(private dataSource: DataSource) {}

  // Hàm lifecycle tự động chạy sau khi ứng dụng kết nối DB thành công
  async onApplicationBootstrap() {
    this.logger.log('Đang kiểm tra và khởi tạo GIN Index cho Database...');

    try {
      // 1. Bật Extension pg_trgm hỗ trợ tìm kiếm text
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

      // 2. Tạo GIN Index cho cột title (Tối ưu tìm kiếm bài hát)
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_track_title_gin ON track USING GIN (title gin_trgm_ops);
      `);
      
      // 3. Tạo GIN Index cho cột artistName (Tối ưu tìm kiếm ca sĩ)
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_track_artist_gin ON track USING GIN ("artistName" gin_trgm_ops);
      `);

      // 4. Tạo GIN Index cho cột albumTitle (Tối ưu tìm kiếm album)
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_track_album_gin ON track USING GIN ("albumTitle" gin_trgm_ops);
      `);

      this.logger.log('✅ Đã thiết lập xong GIN Index siêu tốc cho bảng Track!');
    } catch (error) {
      this.logger.error('Lỗi khi tạo GIN Index:', error.message);
    }
  }
}