"use client";
import { useEffect, useState } from "react";

export default function Home() {
  // 1. Luôn khởi tạo là mảng rỗng để tránh lỗi .map
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    console.log("\n🌐 [FRONTEND]: Bắt đầu fetch dữ liệu từ API...");

    try {
      const res = await fetch("http://localhost:4000/music/artists");
      const data = await res.json();

      console.log("📥 [FRONTEND]: Dữ liệu thô nhận được:", data);

      // 2. Kiểm tra nếu data là mảng thì mới set, nếu không thì set mảng rỗng
      if (Array.isArray(data)) {
        setArtists(data);
        console.log(
          "✅ [FRONTEND]: Đã cập nhật artists vào State (Mảng hợp lệ)"
        );
      } else {
        console.error(
          "❌ [FRONTEND]: API không trả về mảng. Kiểu nhận được:",
          typeof data
        );
        setArtists([]);
      }
    } catch (err) {
      console.error("❌ [FRONTEND]: Lỗi kết nối tới Backend:", err);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Demo Music Manager</h1>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {/* 3. Kiểm tra an toàn trước khi map */}
          {Array.isArray(artists) && artists.length > 0 ? (
            artists.map((artist: any) => (
              <div
                key={artist.id}
                style={{ border: "1px solid #ccc", padding: "10px" }}
              >
                <strong>{artist.name}</strong> (ID: {artist.id})
              </div>
            ))
          ) : (
            <p>Không có dữ liệu nghệ sĩ để hiển thị.</p>
          )}
        </div>
      )}
    </div>
  );
}
