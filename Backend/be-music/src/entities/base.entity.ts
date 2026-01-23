// base.entity.ts - Lớp cơ sở

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
   * Sử dụng UUID thay vì số tự tăng (auto-increment) giúp bảo mật
   * & dễ dàng hợp nhất dữ liệu từ nhiều nguồn khác nhau.
   *
   * [Tuy nhiên] UUID chiếm 16 bytes. Còn INT thì có 4 bytes
   * Vì do là dung lượng có giới hạn nên quyết định sử dụng INT
   * */
  id: string; //<-- UUID [Do đã thay đổi thành localhost]
  // id: number;

  /**
   * Dùng để làm chức năng thống kê (Analytics) hoặc xóa bộ nhớ đệm (Cache Invalidation) khi dữ liệu thay đổi.
   */
  @CreateDateColumn({
    comment: 'Thời điểm bản ghi được tạo',
  })
  createdAt: Date;
  @UpdateDateColumn({
    comment: 'Thời điểm bản ghi được cập nhật lần cuối',
  })
  updatedAt: Date;
}
