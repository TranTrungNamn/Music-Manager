// track.entity.ts

import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Album } from './album.entity';
import { Genre } from './genre.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

/**
 * Thực thể Bài hát - Chứa thông tin chi tiết về file âm nhạc và dữ liệu benchmark.
 */
@Entity('tracks')
/**
 * Composite Index - Chỉ mục hỗn hợp
 * Khi bạn truy vấn danh sách bài hát của một Album và sắp xếp theo số thứ tự (trackNumber),
 * Database hiện tại phải quét toàn bộ bảng. Việc thêm Index hỗn hợp giúp nó tìm thẳng đến vị trí dữ liệu cần thiết.
 */
@Index(['album', 'trackNumber'])
export class Track extends BaseEntity {
  @Column()
  // Khai báo GIN index cho cột title
  // Tiêu đề của bài hát
  @Index({ fulltext: true })
  title: string;
  // Giúp tìm kiếm bài hát theo tên nhanh chóng.

  // Tên file gốc (Do I Wanna Know.flac)
  @Column({ length: 255, comment: 'Tên file gốc' })
  fileName: string;

  // Đường dẫn lưu trữ (relative path)
  // "C:\Users\ACER\qobuzdl\artist_qobuz_new_00\Arctic Monkeys\
  // Arctic Monkeys - AM (2013) [24B-44.1kHz]\01. Do I Wanna Know.flac"
  @Column({ length: 500, comment: 'Đường dẫn tương đối trong storage' })
  relativePath: string;

  // Số thứ tự của bài hát trong Album (track_album)
  @Column({ type: 'int', default: 1, comment: 'Số thứ tự bài hát trong album' })
  trackNumber: number;

  // -- Thông tin kỹ thuật âm thanh
  // Thời lượng nhạc
  @Column({
    type: 'int',
    nullable: true,
    comment: 'Thời lượng tính bằng giây (second)',
  })
  duration: number;

  // (kbps - kilobits per second)
  @Column({ type: 'int', nullable: true, comment: 'Tốc độ bit (kbps)' })
  bitrate: number;

  // (Hz)
  @Column({
    type: 'int',
    nullable: true,
    comment: 'Tần số lấy mẫu (Hz)',
    /** Áp dụng transformer để đảm bảo trả về kiểu number */
    transformer: new ColumnNumericTransformer(),
  })
  sampleRate: number;

  // (16-bit, 24-bit, 32-bit)
  @Column({ type: 'smallint', nullable: true })
  bitDepth: number;

  // type (flac, mp3, wav)
  @Column({ type: 'varchar', length: 10, default: 'flac' })
  extension: string;

  // Kích thước tệp file (byte)
  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Kích thước file tính bằng byte',
    /** Áp dụng transformer để đảm bảo trả về kiểu number */
    transformer: new ColumnNumericTransformer(),
  })
  fileSize: number;

  // --- Benchmark Columns (Phục vụ đo kiểm/phân tích) ---

  @Index()
  @Column({
    nullable: true,
    length: 100,
    comment: 'Từ khóa dùng cho benchmark',
  })
  keyword: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Thứ tự ưu tiên trong benchmark',
  })
  benchmarkOrder: number;

  // -- Denormalization - Phi chuẩn hóa dữ liệu
  @Index()
  @Column({
    length: 255,
    nullable: true,
    comment: 'Tên nghệ sĩ (phi chuẩn hóa)',
  })
  artistName: string;

  @Index()
  @Column({
    length: 255,
    nullable: true,
    comment: 'Tiêu đề album (phi chuẩn hóa)',
  })
  albumTitle: string;

  // --- Relations ---

  /**
   * Bài hát thuộc về một Album.
   * Nếu xóa Album, các Track liên quan sẽ bị xóa theo (CASCADE).
   */
  @ManyToOne(() => Album, (album) => album.tracks, { onDelete: 'CASCADE' })
  album: Album;

  /**
   * Quan hệ N-N với Thể loại.
   * JoinTable sẽ tạo ra bảng trung gian 'track_genres'.
   */
  @ManyToMany(() => Genre, (genre) => genre.tracks)
  @JoinTable({
    // Tên bảng trung gian được tạo ra trong DB
    name: 'track_genres',
    joinColumn: { name: 'track_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];
}
