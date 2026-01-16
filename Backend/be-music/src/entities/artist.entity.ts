// artist.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Album } from './album.entity';

/**
 * Thực thể Nghệ sĩ (Ca sĩ/Nhạc sĩ)
 */
@Entity('artists')
export class Artist extends BaseEntity {
  @Column({ unique: true, length: 255 })
  name: string;

  /**
   * Đường dẫn đến ảnh đại diện
   */
  @Column({
    length: 500,
    nullable: true,
    comment: 'Path đến ảnh đại diện nghệ sĩ',
  })
  picturePath: string;
  /**
   * Danh sách album thuộc về nghệ sĩ này
   */
  @OneToMany(() => Album, (album) => album.artist)
  albums: Album[];
}
