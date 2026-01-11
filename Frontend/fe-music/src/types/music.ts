// 1. Cập nhật Interface Track
export interface Track {
  id: string; // ⚠️ QUAN TRỌNG: Sửa number -> string (để khớp UUID backend)
  title: string;
  trackNumber: number; // Nên thêm để hiển thị số thứ tự bài
  duration?: number;
  fileName?: string; // Thêm nếu muốn hiển thị tên file
  // benchmarkOrder?: number; // <-- Không bắt buộc, chỉ thêm nếu muốn debug
}

// 2. Thêm Interface cho kết quả tìm kiếm (API Search Smart)
export interface SearchResult {
  data: Track[]; // Danh sách bài hát tìm được
  benchmark?: {
    // Thông số đo hiệu năng (Optional)
    testId_used: number;
    fast_query_time: string;
    slow_query_time: string;
    diff_factor: string;
    explanation: {
      fast: string;
      slow: string;
    };
  };
}

// 3. Cập nhật Artist/Album cho đồng bộ (nếu chưa làm)
export interface Artist {
  id: string;
  name: string;
  picturePath?: string;
}

export interface Album {
  id: string;
  title: string;
  coverPath?: string;
  artist: Artist;
  tracks?: Track[];
}
