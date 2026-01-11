"use client";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:4000";

// --- TYPES ---
interface Track {
  id: string;
  title: string;
  duration: number;
  album: { title: string; artist: { name: string } };
}

interface BenchmarkResult {
  testId_used: number;
  fast_query_time: string;
  slow_query_time: string;
  diff_factor: string;
  explanation?: {
    // ⚠️ Thêm dấu ? để tránh lỗi nếu backend chưa trả về field này
    fast: string;
    slow: string;
  };
}

interface SearchResponse {
  data: Track[];
  benchmark?: BenchmarkResult;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ tracks: 0, albums: 0, artists: 0 });
  const [musicList, setMusicList] = useState<Track[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [seedStep, setSeedStep] = useState(0);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedCountInput, setSeedCountInput] = useState(1000000);

  useEffect(() => {
    fetchStats();
    handleSearch("");
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/music/stats`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error("Lỗi lấy stats:", e);
    }
  };

  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    setBenchmark(null);

    try {
      const res = await fetch(`${API_BASE}/music/search-smart?q=${keyword}`);

      if (!res.ok) {
        setMusicList([]);
        return;
      }

      const result: SearchResponse = await res.json();
      setMusicList(Array.isArray(result.data) ? result.data : []);

      if (result.benchmark) {
        setBenchmark(result.benchmark);
      }
    } catch (e) {
      console.error("Lỗi API Search:", e);
      setMusicList([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSeed = () => {
    if (seedStep === 0) {
      setSeedStep(1);
    } else if (seedStep === 1) {
      setSeedStep(2);
      fetch(`${API_BASE}/benchmark/seed?limit=${seedCountInput}`).catch(
        console.error
      );

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/benchmark/progress`);
          const data = await res.json();
          setSeedProgress(data.progress);

          if (!data.isSeeding && data.progress === 100) {
            clearInterval(interval);
            setSeedStep(0);
            fetchStats();
            handleSearch("");
            alert(`✅ Đã tạo xong ${seedCountInput.toLocaleString()} bản ghi!`);
          }
        } catch {
          clearInterval(interval);
          setSeedStep(0);
        }
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-20">
      {/* HEADER */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            {/* ✨ SỬA CLASS CSS: bg-gradient -> bg-linear */}
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-green-400 to-blue-500">
              Music DB Manager
            </h1>
            <div className="flex gap-4 text-xs text-gray-400 font-mono mt-1">
              <span>💿 {stats.tracks.toLocaleString()} Tracks</span>
              <span>🎤 {stats.artists.toLocaleString()} Artists</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <div className="flex flex-col items-end mr-2">
              <label className="text-[10px] text-gray-400 uppercase font-bold">
                Số lượng Tracks
              </label>
              <input
                type="number"
                value={seedCountInput}
                onChange={(e) => setSeedCountInput(Number(e.target.value))}
                disabled={seedStep !== 0}
                className="bg-transparent text-right font-mono text-green-400 font-bold focus:outline-none w-32 border-b border-gray-600 focus:border-green-500"
              />
            </div>

            <button
              onClick={handleSeed}
              disabled={seedStep === 2}
              className={`px-5 py-2 rounded-md font-bold text-sm transition-all shadow-lg ${
                seedStep === 0
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : seedStep === 1
                  ? "bg-red-600 hover:bg-red-500 animate-pulse text-white"
                  : "bg-gray-800 text-gray-500 cursor-wait"
              }`}
            >
              {seedStep === 0
                ? "🚀 Generate"
                : seedStep === 1
                ? "⚠️ Confirm?"
                : `Running ${seedProgress}%`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 mb-10 mt-4">
          <div className="flex gap-4 shadow-lg shadow-green-900/10">
            <input
              type="text"
              placeholder="Nhập tên bài hát (VD: Track #100) hoặc ID (VD: 500)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              className="flex-1 bg-[#1e1e1e] border border-gray-700 rounded-l-lg px-6 py-4 text-lg focus:outline-none focus:border-green-500 transition-colors"
            />
            <button
              onClick={() => handleSearch(query)}
              className="bg-green-600 hover:bg-green-500 text-black font-bold px-8 rounded-r-lg text-lg transition active:scale-95 border-t border-b border-r border-green-600"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {benchmark && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {/* ✨ SỬA CLASS CSS: bg-gradient -> bg-linear */}
              <div className="bg-linear-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">
                    📊 Performance Benchmark Result
                  </h3>
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">
                    🚀 Gap: {benchmark.diff_factor}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Cột Fast */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                        INDEX SCAN
                      </span>
                      <span className="text-white font-mono text-lg">
                        {benchmark.fast_query_time}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-full rounded-full w-full"></div>
                    </div>
                    {/* 🛠️ FIX LỖI CRASH: Thêm optional chaining ?. */}
                    <p className="text-[10px] text-gray-500 mt-2 font-mono bg-black/30 p-2 rounded truncate">
                      {benchmark.explanation?.fast || "N/A"}
                    </p>
                  </div>

                  {/* Cột Slow */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-red-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>{" "}
                        FULL SCAN
                      </span>
                      <span className="text-white font-mono text-lg">
                        {benchmark.slow_query_time}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-full rounded-full w-full"></div>
                    </div>
                    {/* 🛠️ FIX LỖI CRASH: Thêm optional chaining ?. */}
                    <p className="text-[10px] text-gray-500 mt-2 font-mono bg-black/30 p-2 rounded truncate">
                      {benchmark.explanation?.slow || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Tracks Found{" "}
            <span className="bg-gray-800 text-xs py-1 px-2 rounded-full text-gray-400">
              {musicList?.length || 0}
            </span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded hover:bg-gray-800 ${
                viewMode === "grid" ? "text-green-400" : "text-gray-500"
              }`}
            >
              📱 Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded hover:bg-gray-800 ${
                viewMode === "list" ? "text-green-400" : "text-gray-500"
              }`}
            >
              📃 List
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {musicList.length > 0 ? (
              musicList.map((track) => (
                <div
                  key={track.id}
                  className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition group cursor-pointer shadow-lg"
                >
                  {/* ✨ SỬA CLASS CSS: bg-gradient -> bg-linear */}
                  <div className="aspect-square bg-linear-to-br from-gray-800 to-gray-700 rounded mb-3 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition duration-300">
                    🎵
                  </div>
                  <h3 className="font-bold text-sm truncate text-white mb-1">
                    {track.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate hover:underline">
                    {track.album?.artist?.name || "Unknown Artist"}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate mt-1">
                    {track.album?.title || "Unknown Album"}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                Không tìm thấy bài hát nào (Hãy thử chạy Seeding trước)
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {musicList.length > 0 ? (
              musicList.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-2 rounded hover:bg-[#2a2a2a] group transition cursor-pointer"
                >
                  <div className="text-gray-500 w-6 text-center text-sm">
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-lg">
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate group-hover:text-green-400">
                      {track.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {track.album?.artist?.name || "Unknown"}
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-gray-400 w-1/4 truncate">
                    {track.album?.title || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {track.duration
                      ? `${Math.floor(track.duration / 60)}:${(
                          track.duration % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "--:--"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                Không tìm thấy bài hát nào
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
