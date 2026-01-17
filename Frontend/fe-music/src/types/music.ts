// src/types/music.ts

export interface Track {
  id: string;
  title: string;
  duration: number;

  // ✅ CẬP NHẬT: Backend trả về các trường phẳng (denormalized)
  artistName: string;
  albumTitle: string;

  // Giữ lại optional nếu cần tương thích ngược, nhưng code chính sẽ dùng 2 trường trên
  trackNumber?: number;
  fileName?: string;
}

// ✅ THÊM: Interface cho Benchmark để sửa lỗi import
export interface BenchmarkResult {
  is_active?: boolean;
  testId_used: number;
  fast_query_time: string;
  slow_query_time: string;
  diff_factor: string;
  explanation?: {
    fast: string;
    slow: string;
  };
}
