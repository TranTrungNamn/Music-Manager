/**
 * Transformer giúp chuyển đổi kiểu dữ liệu giữa Database và Code.
 * Giúp giải quyết vấn đề BigInt bị trả về dạng string trong Node.js.
 */
export class ColumnNumericTransformer {
  /**
   * Chuyển đổi từ dữ liệu trong Code (number) sang dữ liệu lưu vào DB (bigint/string)
   */
  to(data: number): number {
    return data;
  }

  /**
   * Chuyển đổi từ dữ liệu DB (string) sang dữ liệu sử dụng trong Code (number)
   */
  from(data: string): number | null {
    if (!data) return null;
    const res = Number(data);
    return isNaN(res) ? null : res;
  }
}
