// Frontend/fe-music/src/app/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function PerformanceDemo() {
  const [progress, setProgress] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // 1. Hàm kích hoạt Seeder 1 triệu dòng
  const startBigSeed = async () => {
    setIsSeeding(true);
    setProgress(0);
    console.log("🚀 [FRONTEND]: Bắt đầu yêu cầu Seed 1 triệu dòng...");

    // Gọi API seed (không đợi res vì nó sẽ chạy lâu)
    fetch("http://localhost:4000/benchmark/seed").catch(console.error);

    // Bắt đầu vòng lặp lấy tiến độ mỗi 1 giây
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:4000/benchmark/progress");
        const data = await res.json();
        setProgress(data.progress);

        if (data.progress >= 100 || !data.isSeeding) {
          clearInterval(interval);
          setIsSeeding(false);
          alert("✅ Đã hoàn tất chèn 1 triệu dòng dữ liệu!");
        }
      } catch (err) {
        console.error("Lỗi kiểm tra tiến độ:", err);
      }
    }, 1000);
  };

  return (
    <div
      style={{
        padding: "50px",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
        fontFamily: "Arial",
      }}
    >
      <h1>⚡ Performance Benchmark (1 Million Rows)</h1>
      <p>Thử nghiệm khả năng chịu tải và truy vấn của Neon DB</p>

      <div
        style={{
          margin: "30px 0",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <button
          onClick={startBigSeed}
          disabled={isSeeding}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: isSeeding ? "#ccc" : "#E91E63",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isSeeding ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {isSeeding ? "🚀 Đang chèn dữ liệu..." : "🔥 Seed 1.000.000 Tracks"}
        </button>

        {isSeeding && (
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                width: "100%",
                backgroundColor: "#eee",
                height: "25px",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#4CAF50",
                  height: "100%",
                  transition: "width 0.5s ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px",
                }}
              >
                {progress}%
              </div>
            </div>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "10px" }}>
              Đang ghi dữ liệu vào Neon DB... Vui lòng không đóng trình duyệt.
            </p>
          </div>
        )}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div
          style={{
            padding: "20px",
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h3>Database Status</h3>
          <p>
            Neon Serverless: <strong>Active</strong>
          </p>
          <p>
            Table: <code>tracks</code>
          </p>
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h3>Performance</h3>
          <p>
            Batch Insert: <strong>5,000/req</strong>
          </p>
          <p>
            Total Goal: <strong>1,000,000</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
