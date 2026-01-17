import React from "react";
import { BenchmarkResult } from "@/types/music";

interface BenchmarkTableProps {
  benchmark: BenchmarkResult | null;
}

export const BenchmarkTable = ({ benchmark }: BenchmarkTableProps) => {
  // ✅ SỬA: Chỉ ẩn khi không có dữ liệu benchmark, không quan tâm is_active
  if (!benchmark) return null;

  // Kiểm tra xem có dữ liệu demo (Slow Query) hay không
  const hasSlowData =
    benchmark.is_active && benchmark.slow_query_time !== "N/A";

  return (
    <div className="glass-hover glass rounded-2xl p-8 relative overflow-hidden shadow-3d border border-white/20 animate-scale-in mb-8">
      {/* Background Decoration - Đổi màu nếu chưa bật Demo */}
      <div
        className={`absolute top-0 left-0 w-2 h-full rounded-r-full transition-colors duration-500 ${hasSlowData ? "bg-linear-to-b from-red-500 to-green-500" : "bg-green-500"}`}
      ></div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold gradient-text mb-6 flex items-center gap-2">
          📊 Database Performance Report
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CARD 1: FAST QUERY (Luôn hiển thị) */}
          <div className="glass rounded-xl p-6 border border-green-500/30 bg-green-500/5 relative overflow-hidden hover:bg-green-500/10 transition-colors">
            <div className="absolute -right-4 -top-4 text-9xl text-green-500/10 font-black select-none pointer-events-none">
              FAST
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <div className="text-green-400 font-bold text-sm tracking-wide uppercase">
                  Current Query (Indexed)
                </div>
              </div>
              <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                {benchmark.fast_query_time}
              </div>
              <div className="text-gray-400 text-xs mt-3 font-medium bg-black/20 inline-block px-2 py-1 rounded">
                ⚡ {benchmark.explanation?.fast || "Query Builder"}
              </div>
            </div>
          </div>

          {/* CARD 2: SLOW QUERY (Hiển thị mờ hoặc N/A nếu tắt Demo) */}
          <div
            className={`glass rounded-xl p-6 border relative overflow-hidden transition-all ${hasSlowData ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10" : "border-gray-500/10 bg-gray-500/5 opacity-60"}`}
          >
            <div
              className={`absolute -right-4 -top-4 text-9xl font-black select-none pointer-events-none ${hasSlowData ? "text-red-500/10" : "text-gray-500/10"}`}
            >
              SLOW
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${hasSlowData ? "bg-red-500" : "bg-gray-500"}`}
                ></div>
                <div
                  className={`${hasSlowData ? "text-red-400" : "text-gray-400"} font-bold text-sm tracking-wide uppercase`}
                >
                  Comparison (Full Scan)
                </div>
              </div>
              <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                {hasSlowData ? benchmark.slow_query_time : "--"}
              </div>
              <div className="text-gray-400 text-xs mt-3 font-medium bg-black/20 inline-block px-2 py-1 rounded">
                {hasSlowData
                  ? `🐌 ${benchmark.explanation?.slow}`
                  : "⚠️ Turn on Demo Mode to test"}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY BADGE (Chỉ hiện khi có so sánh) */}
        {hasSlowData && (
          <div className="mt-8 text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 glass px-8 py-3 rounded-full border border-orange-500/30 text-orange-400 font-bold text-lg shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-105">
              <span>🚀</span>
              <span>
                Optimization Factor:{" "}
                <span className="text-white text-xl">
                  {benchmark.diff_factor}x
                </span>{" "}
                faster
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
