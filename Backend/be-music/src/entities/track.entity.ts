import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Album } from './album.entity';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string; // Tên bài hát từ Metadata

  @Column()
  fileName: string; // Tên file thực tế (vd: 01. do i wanna know.flac)

  @Column()
  relativePath: string; // Đường dẫn tương đối dùng cho FileManagerService

  @Column({ type: 'int', nullable: true })
  duration: number; // Thời lượng (giây)

  // --- Thông số kỹ thuật chuyên sâu cho FLAC ---

  @Column({ type: 'int', nullable: true })
  bitrate: number; // kbps

  @Column({ type: 'int', nullable: true })
  sampleRate: number; // Hz (vd: 44100, 96000)

  @Column({ type: 'int', nullable: true })
  bitDepth: number; // Bit (vd: 16, 24)

  @Column({ type: 'varchar', length: 10, default: 'flac' })
  extension: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number; // Kích thước file (bytes)

  // --- Quan hệ ---

  @ManyToOne(() => Album, (album) => album.tracks, { onDelete: 'CASCADE' })
  album: Album;

  @CreateDateColumn()
  createdAt: Date;
}
