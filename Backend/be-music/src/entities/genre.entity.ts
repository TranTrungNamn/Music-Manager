// genre.entity.ts
import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Track } from './track.entity';

/**
 * Thực thể Thể loại nhạc (Rock, Jazz, Pop...)
 */
@Entity('genres')
export class Genre extends BaseEntity {
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * Quan hệ N-N với Track. Một thể loại có nhiều bài hát và ngược lại.
   */
  @ManyToMany(() => Track, (track) => track.genres)
  tracks: Track[];
}
