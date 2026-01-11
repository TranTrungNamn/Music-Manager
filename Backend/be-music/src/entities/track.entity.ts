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

  @Index() // Vẫn giữ Index cho Title vì thực tế app nghe nhạc nào cũng cần tìm tên
  @Column()
  title: string;

  @Column()
  fileName: string;

  // --- CÁC CỘT CHUYÊN DỤNG CHO BENCHMARK ---

  @Index() // ⚡ Đánh Index -> Tìm cực nhanh
  @Column({ nullable: true })
  keyword: string; // VD: "key_500000"

  @Column({ type: 'int', nullable: true })
  // 🐢 KHÔNG đánh Index -> Tìm chậm (Quét toàn bảng)
  benchmarkOrder: number; // VD: 500000

  // -----------------------------------------

  @Column({ type: 'int', default: 1 })
  trackNumber: number;

  @Column()
  relativePath: string;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'int', nullable: true })
  bitrate: number;

  @Column({ type: 'int', nullable: true })
  sampleRate: number;

  @Column({ type: 'int', nullable: true })
  bitDepth: number;

  @Column({ type: 'varchar', length: 10, default: 'flac' })
  extension: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @ManyToOne(() => Album, (album) => album.tracks, { onDelete: 'CASCADE' })
  album: Album;

  @CreateDateColumn()
  createdAt: Date;
}
