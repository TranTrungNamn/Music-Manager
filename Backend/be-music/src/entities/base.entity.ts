// base.entity.ts

import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Nền tảng của mọi table
 * Thực thể cơ sở chứa các trường chung cho toàn bộ hệ thống.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    comment: 'Thời điểm bản ghi được tạo',
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Thời điểm bản ghi được cập nhật lần cuối',
  })
  updatedAt: Date;
}
