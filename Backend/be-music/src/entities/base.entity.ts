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
  /**
   * Sử dụng UUID thay vì số tự tăng (auto-increment)
   * [Tuy nhiên] UUID chiếm 16 bytes. Còn INT thì có 4 bytes
   * Vì do là dung lượng có giới hạn nên quyết định sử dụng INT
   * */
  // id: string; //<-- UUID
  id: number;

  @CreateDateColumn({
    comment: 'Thời điểm bản ghi được tạo',
  })
  // Theo dõi thời gian tạo.
  // Để Analytics. Đánh INDEX theo thời gian
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Thời điểm bản ghi được cập nhật lần cuối',
  })
  // Phục vụ cho tiến trình đồng bộ dữ liệu (Sync)
  // Cache Invalidation
  updatedAt: Date;
}
