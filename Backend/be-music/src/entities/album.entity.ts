import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Track } from './track.entity';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // AM

  @Column()
  releaseYear: number; // 2013

  @Column()
  bitDepth: number; // 24

  @Column({ type: 'float' })
  sampleRate: number; // 44.1

  @Column({ nullable: true })
  coverPath: string; // Đường dẫn tới file cover.jpg

  @ManyToOne(() => Artist, (artist) => artist.albums)
  artist: Artist;

  @OneToMany(() => Track, (track) => track.album)
  tracks: Track[];
}
