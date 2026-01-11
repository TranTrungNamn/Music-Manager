import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Album } from './album.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
  // PHẢI có type: 'varchar' để Postgres không hiểu lầm là Object
  @Column({ type: 'varchar', nullable: true }) // THÊM type: 'varchar' VÀO ĐÂY
  picturePath: string | null;

  @OneToMany(() => Album, (album) => album.artist)
  albums: Album[];
}
