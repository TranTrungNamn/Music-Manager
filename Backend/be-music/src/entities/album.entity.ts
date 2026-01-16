import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Artist } from './artist.entity';
import { Track } from './track.entity';
import { ColumnNumericTransformer } from '../common/transformers/column-numeric.transformer';

/**
 * Thực thể Album âm nhạc
 */
@Entity('albums')
export class Album extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'smallint',
    comment: 'Năm phát hành album',
  })
  releaseYear: number;

  @Column({
    type: 'smallint',
    default: 16,
    comment: 'Độ sâu bit (16-bit, 24-bit, 32-bit,...)',
  })
  bitDepth: number;

  @Column({
    // đổi float sang decimal
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: 'Tần số lấy mẫu (44.1, 48.0, 96.0...)',
    transformer: new ColumnNumericTransformer(),
  })
  sampleRate: number;

  /**
   * "C:\Users\ACER\qobuzdl\
   * artist_qobuz_new_00\
   * Arctic Monkeys\Arctic Monkeys - AM (2013) [24B-44.1kHz]\cover.jpg"
   */
  @Column({
    nullable: true,
    length: 500,
    comment: 'Đường dẫn tới ảnh bìa album',
  })
  coverPath: string;

  // -- Relation --
  /**
   * Quan hệ Artist 1-N.
   * Nếu nghệ sĩ bị xóa, set artist_id trong album thành NULL.
   */
  @ManyToOne(() => Artist, (artist) => artist.albums, { onDelete: 'SET NULL' })
  artist: Artist;

  /**
   * Danh sách các bài hát nằm trong album này
   */
  @OneToMany(() => Track, (track) => track.album)
  tracks: Track[];
}
