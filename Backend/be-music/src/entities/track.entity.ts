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

/**
 * Thực thể Bài hát - Chứa thông tin chi tiết về file âm nhạc và dữ liệu benchmark.
 */
@Entity('tracks')
export class Track extends BaseEntity {
  @Index()
  @Column({ length: 255 })
  title: string;

  @Column({ length: 500, comment: 'Tên file gốc' })
  fileName: string;

  @Column({ length: 500, comment: 'Đường dẫn tương đối trong storage' })
  relativePath: string;

  @Column({ type: 'int', default: 1, comment: 'Số thứ tự bài hát trong album' })
  trackNumber: number;

  /*
   * Thông tin kỹ thuật của tệp âm thanh
   */

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Thời lượng tính bằng giây (second)',
  })
  duration: number;

  @Column({ type: 'int', nullable: true, comment: 'Tốc độ bit (kbps)' })
  bitrate: number;

  @Column({ type: 'int', nullable: true, comment: 'Tần số lấy mẫu (Hz)' })
  sampleRate: number;

  @Column({ type: 'smallint', nullable: true })
  bitDepth: number;

  @Column({ type: 'varchar', length: 10, default: 'flac' })
  extension: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Kích thước file tính bằng byte',
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
