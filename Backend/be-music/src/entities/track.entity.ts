import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany, // <--- Nhớ import cái này
  JoinTable,  // <--- Nhớ import cái này
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Album } from './album.entity';
import { BaseEntity } from './base.entity';
import { Genre } from './genre.entity'; // <--- Nhớ import cái này
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

@Entity('tracks')
@Index(['title', 'artistName', 'albumTitle']) 
export class Track extends BaseEntity {
  // [LƯU Ý] Đã xóa khai báo id để thừa kế từ BaseEntity

  @ApiProperty({ example: 'Numb', description: 'Tên bài hát' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Linkin Park', description: 'Tên nghệ sĩ' })
  @Column({ name: 'artistName', nullable: true })
  artistName: string;

  @ApiProperty({ example: 'Meteora', description: 'Tên Album' })
  @Column({ name: 'albumTitle', nullable: true })
  albumTitle: string;

  @ApiProperty({ 
    example: 'Linkin Park\\Meteora (2003)\\01. Numb.flac', 
    description: 'Đường dẫn tương đối lưu file' 
  })
  @Column({ name: 'relativePath', nullable: true })
  relativePath: string;

  @ApiProperty({ example: '01. Numb.flac', description: 'Tên file vật lý' })
  @Column({ name: 'fileName', nullable: true })
  fileName: string;

  @ApiProperty({ example: 1, description: 'Số thứ tự bài trong Album' })
  @Column({ type: 'int', default: 0 })
  trackNumber: number;

  @ApiProperty({ example: 187, description: 'Thời lượng bài hát (giây)' })
  @Column({ type: 'int', default: 0 })
  duration: number;

  @ApiProperty({ example: 35000000, description: 'Dung lượng file (bytes)' })
  @Column({ type: 'bigint', default: 0, transformer: new ColumnNumericTransformer() })
  fileSize: number;

  @ApiProperty({ example: 1411, description: 'Bitrate (kbps)' })
  @Column({ type: 'int', default: 0 })
  bitrate: number;

  @ApiProperty({ example: 44100, description: 'Sample Rate (Hz)' })
  @Column({ type: 'int', default: 0 })
  sampleRate: number;

  @ApiProperty({ example: 16, description: 'Độ sâu bit (16bit/24bit)' })
  @Column({ type: 'int', default: 16 })
  bitDepth: number;

  @ApiProperty({ example: 'flac', description: 'Đuôi file' })
  @Column({ length: 10, nullable: true })
  extension: string;

  @ApiProperty({ example: 'audio/flac', description: 'MIME Type' })
  @Column({ nullable: true })
  mimeType: string;

  @ApiProperty({ example: false, description: 'Đánh dấu yêu thích' })
  @Column({ default: false })
  isFavorite: boolean;

  @ApiProperty({ example: 10, description: 'Số lần phát' })
  @Column({ default: 0 })
  playCount: number;

  @ApiProperty({ example: 100, description: 'Thứ tự insert (dùng cho Benchmark)' })
  @Column({ type: 'int', default: 0 })
  benchmarkOrder: number;
  
  // --- RELATIONS (Quan hệ bảng) ---

  @ManyToOne(() => Album, (album) => album.tracks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'albumId' })
  album: Album;

  // 👇👇👇 ĐÂY LÀ PHẦN BỊ THIẾU CẦN THÊM VÀO 👇👇👇
  @ManyToMany(() => Genre, (genre) => genre.tracks)
  @JoinTable({
    name: 'track_genres',
    joinColumn: { name: 'track_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];
  // 👆👆👆 -------------------------------------- 👆👆👆
}