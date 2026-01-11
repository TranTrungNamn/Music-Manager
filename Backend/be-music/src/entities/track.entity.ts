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
  title: string; // Tên bài hát (VD: Shape of You)

  @Column()
  fileName: string; // Tên file thật (VD: 01. Shape of You.flac)

  @Column({ type: 'int', default: 1 })
  trackNumber: number; // ✨ CỘT MỚI: Số thứ tự trong Album

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
  extension: string; // ✨ Luôn là 'flac'

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @ManyToOne(() => Album, (album) => album.tracks, { onDelete: 'CASCADE' })
  album: Album;

  @CreateDateColumn()
  createdAt: Date;
}
