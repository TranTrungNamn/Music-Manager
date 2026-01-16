"use client";
import { useState, useEffect } from "react";

// bg-gradient -> bg-linear
// z-[100] -> z-100
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
  explanation?: { fast: string; slow: string };
}

type SearchFilterType = "all" | "title" | "artist" | "album";

// --- COMPONENT: HIGHLIGHT TEXT ---
const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) => {
  if (!text) return null;
  if (!highlight || !highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="bg-yellow-500 text-black font-bold px-0.5 rounded-sm"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"search" | "library">("search");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light" | "cyber">(
    "dark"
  );
  const [stats, setStats] = useState({ tracks: 0, albums: 0, artists: 0 });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false); // Để ẩn/hiện thông báo

  // --- SEARCH STATE ---
  const [musicList, setMusicList] = useState<Track[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [query, setQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>("all"); // Filter State
  const [isSearching, setIsSearching] = useState(false);
  // Search Pagination State
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotalRecords, setSearchTotalRecords] = useState(0);

  // --- LIBRARY STATE ---
  const [libraryList, setLibraryList] = useState<Track[]>([]);
  const [libPage, setLibPage] = useState(1);
  const [libTotalPages, setLibTotalPages] = useState(1);
  const [libTotalRecords, setLibTotalRecords] = useState(0);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState("1");

  // --- SEED STATE ---
  const [seedStep, setSeedStep] = useState(0);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedCountInput, setSeedCountInput] = useState(1000000);

  useEffect(() => {
    fetchStats();
    if (activeTab === "library") fetchLibrary(1);
  }, [activeTab]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("music-manager-theme") as
      | "dark"
      | "light"
      | "cyber";
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      // Set default dark theme
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Apply theme changes
  const applyTheme = (theme: "dark" | "light" | "cyber") => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("music-manager-theme", theme);
  };

  // Cycle through themes
  const toggleTheme = () => {
    const themes: ("dark" | "light" | "cyber")[] = ["dark", "light", "cyber"];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex]);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/music/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsConnected(true); // Kết nối thành công
        setShowToast(true); // Hiển thị thông báo

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setIsConnected(false);
      }
    } catch (e) {
      console.error("Kết nối thất bại:", e);
      setIsConnected(false);
    }
  };

  // --- SEARCH LOGIC ---
  const handleSearch = async (
    keyword: string,
    pageNum: number = 1,
    filterType: SearchFilterType = searchFilter
  ) => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    if (pageNum === 1) setBenchmark(null); // Chỉ reset benchmark nếu search mới

    try {
      // Gọi API với đủ params: q, filter, page, limit
      const url = `${API_BASE}/music/search-smart?q=${keyword}&filter=${filterType}&page=${pageNum}&limit=20`;
      const res = await fetch(url);
      const result = await res.json();

      setMusicList(Array.isArray(result.data) ? result.data : []);

      // Cập nhật Pagination Meta
      if (result.meta) {
        setSearchTotalPages(result.meta.lastPage);
        setSearchTotalRecords(result.meta.total);
        setSearchPage(result.meta.page);
      }

      if (result.benchmark) setBenchmark(result.benchmark);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search mới khi đổi Filter hoặc bấm nút Search
  const executeNewSearch = () => {
    setSearchPage(1);
    handleSearch(query, 1, searchFilter);
  };

  // Trigger chuyển trang Search
  const changeSearchPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= searchTotalPages) {
      handleSearch(query, newPage, searchFilter);
    }
  };

  // --- LIBRARY LOGIC ---
  const fetchLibrary = async (pageNum: number) => {
    if (pageNum < 1) pageNum = 1;
    setIsLoadingLibrary(true);
    try {
      const res = await fetch(`${API_BASE}/music/all?page=${pageNum}&limit=20`);
      const data = await res.json();
      setLibraryList(data.data);
      setLibTotalPages(data.lastPage);
      setLibTotalRecords(data.total);
      setLibPage(Number(data.page));
      setJumpPageInput(data.page.toString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput);
    if (!isNaN(p) && p > 0) fetchLibrary(p);
  };

  const handleSeed = () => {
    if (seedStep === 0) setSeedStep(1);
    else if (seedStep === 1) {
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
            alert(`✅ Done!`);
          }
        } catch {
          clearInterval(interval);
          setSeedStep(0);
        }
      }, 1000);
    }
  };

  // --- RENDERER (Đã fix Highlight cho cả Artist & Album) ---
  const TrackListRenderer = ({
    tracks,
    highlightKeyword,
    pageIndex,
    pageSize = 20,
  }: {
    tracks: Track[];
    highlightKeyword?: string;
    pageIndex: number;
    pageSize?: number;
  }) => {
    if (tracks.length === 0)
      return (
        <div className="text-center text-gray-500 py-10">No data found.</div>
      );

    // Grid View
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="card-3d glass-hover glass rounded-2xl p-5 border border-white/10 shadow-xl group animate-bounce-in hover-lift"
              style={{
                animationDelay: `${index * 0.08}s`,
                animationFillMode: "both",
              }}
            >
              <div className="aspect-square bg-linear-to-br from-purple-500/20 via-teal-500/20 to-orange-500/20 rounded-xl mb-4 flex items-center justify-center text-5xl shadow-inner relative overflow-hidden">
                <span className="z-10 drop-shadow-lg">🎵</span>
                <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-teal-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
              </div>

              <div className="space-y-2">
                <h3
                  className="font-bold text-sm truncate text-white leading-tight"
                  title={track.title}
                >
                  <HighlightText
                    text={track.title}
                    highlight={highlightKeyword}
                  />
                </h3>

                <div className="space-y-1">
                  <p
                    className="text-xs text-gray-300 truncate flex items-center gap-1"
                    title={track.album?.artist?.name}
                  >
                    <span className="text-teal-400">👤</span>
                    <HighlightText
                      text={track.album?.artist?.name || "Unknown"}
                      highlight={highlightKeyword}
                    />
                  </p>
                  <p
                    className="text-[10px] text-gray-400 truncate flex items-center gap-1"
                    title={track.album?.title}
                  >
                    <span className="text-orange-400">💿</span>
                    <HighlightText
                      text={track.album?.title || "Unknown Album"}
                      highlight={highlightKeyword}
                    />
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] text-gray-500 font-mono text-center">
                    {track.duration
                      ? `${Math.floor(track.duration / 60)}:${(
                          track.duration % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "--:--"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // List View
    return (
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="glass-hover glass flex items-center gap-4 p-4 rounded-xl border border-white/10 shadow-lg hover-glow hover-lift animate-slide-in-right group"
            style={{
              animationDelay: `${index * 0.06}s`,
              animationFillMode: "both",
            }}
          >
            <div className="glass w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-teal-400 border border-white/20">
              {(pageIndex - 1) * pageSize + index + 1}
            </div>

            <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-teal-500/20 rounded-lg flex items-center justify-center text-xl shadow-inner group-hover:shadow-purple-500/20 transition-shadow duration-300">
              🎵
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate mb-1">
                <HighlightText
                  text={track.title}
                  highlight={highlightKeyword}
                />
              </div>
              <div className="text-sm text-gray-300 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="text-teal-400 text-xs">👤</span>
                  <HighlightText
                    text={track.album?.artist?.name || "Unknown"}
                    highlight={highlightKeyword}
                  />
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                <span className="flex items-center gap-1">
                  <span className="text-orange-400 text-xs">💿</span>
                  <span className="text-gray-400">
                    <HighlightText
                      text={track.album?.title || "Unknown Album"}
                      highlight={highlightKeyword}
                    />
                  </span>
                </span>
              </div>
            </div>

            <div className="glass px-3 py-1 rounded-lg border border-white/20">
              <div className="text-xs text-gray-300 font-mono font-bold">
                {track.duration
                  ? `${Math.floor(track.duration / 60)}:${(track.duration % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "--:--"}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white font-sans pb-20 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-linear-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-linear-to-r from-teal-500/10 to-cyan-500/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-linear-to-r from-orange-500/10 to-yellow-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <header className="glass border-b border-white/10 sticky top-0 z-50 shadow-3d backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-primary flex items-center justify-center shadow-lg">
                <span className="text-xl">🎵</span>
              </div>
              <h1 className="text-2xl font-bold gradient-text">
                Music Manager
              </h1>
            </div>
            <div className="glass rounded-xl p-1 border border-white/20 shadow-lg">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover-scale ${
                  activeTab === "search"
                    ? "bg-linear-primary text-white shadow-lg transform scale-105 hover-lift"
                    : "text-gray-300 hover:text-white hover:bg-white/5 hover-glow"
                }`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover-scale ${
                  activeTab === "library"
                    ? "bg-linear-secondary text-white shadow-lg transform scale-105 hover-lift"
                    : "text-gray-300 hover:text-white hover:bg-white/5 hover-glow"
                }`}
              >
                📚 Library
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-xl p-1 border border-white/20 shadow-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all duration-300 hover-scale ${
                  viewMode === "grid"
                    ? "bg-linear-primary text-white shadow-lg transform scale-110 hover-lift"
                    : "text-gray-400 hover:text-white hover:bg-white/10 hover-glow"
                }`}
              >
                📱
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all duration-300 hover-scale ${
                  viewMode === "list"
                    ? "bg-linear-primary text-white shadow-lg transform scale-110 hover-lift"
                    : "text-gray-400 hover:text-white hover:bg-white/10 hover-glow"
                }`}
              >
                📃
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="glass-hover glass w-12 h-12 rounded-xl border border-white/20 shadow-lg flex items-center justify-center text-xl hover-rotate hover-glow group"
              title={`Current: ${currentTheme} theme - Click to switch`}
            >
              {currentTheme === "dark" && "🌙"}
              {currentTheme === "light" && "☀️"}
              {currentTheme === "cyber" && "⚡"}
            </button>

            <div className="glass flex items-center gap-3 p-3 rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Seed:</span>
                <input
                  type="number"
                  value={seedCountInput}
                  onChange={(e) => setSeedCountInput(Number(e.target.value))}
                  disabled={seedStep !== 0}
                  className="bg-transparent text-right font-mono text-teal-400 font-bold w-24 outline-none border-b border-transparent focus:border-teal-400 transition-colors"
                />
              </div>
              <button
                onClick={handleSeed}
                disabled={seedStep === 2}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 hover-scale ${
                  seedStep === 0
                    ? "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-500/25 hover-lift"
                    : seedStep === 1
                    ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg animate-pulse hover-glow"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {seedStep === 0
                  ? "🚀 Seed DB"
                  : seedStep === 1
                  ? "⚠️ Confirm?"
                  : `📊 ${seedProgress}%`}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* --- VIEW 1: SEARCH --- */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="glass-hover glass rounded-2xl p-6 shadow-3d border border-white/20">
              {/* FILTER DROPDOWN */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <select
                    value={searchFilter}
                    onChange={(e) =>
                      setSearchFilter(e.target.value as SearchFilterType)
                    }
                    className="glass-hover glass w-full md:w-48 bg-transparent border border-white/20 text-white text-sm rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block p-4 font-semibold outline-none transition-all duration-300 appearance-none"
                  >
                    <option value="all" className="bg-gray-800">
                      🌐 All Fields
                    </option>
                    <option value="title" className="bg-gray-800">
                      🎵 Track Name
                    </option>
                    <option value="artist" className="bg-gray-800">
                      👤 Artist
                    </option>
                    <option value="album" className="bg-gray-800">
                      💿 Album
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 flex shadow-2xl rounded-xl overflow-hidden">
                  <input
                    type="text"
                    placeholder="Search your music collection..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && executeNewSearch()}
                    className="flex-1 bg-linear-to-r from-white/5 to-white/10 backdrop-blur-sm border-r border-white/10 px-6 py-4 text-lg focus:outline-none focus:bg-white/15 transition-all duration-300 placeholder:text-gray-400"
                  />
                  <button
                    onClick={executeNewSearch}
                    className="bg-linear-primary hover:bg-linear-secondary text-white font-bold px-8 py-4 text-lg hover-lift hover-glow transform hover:scale-105"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Searching...
                      </div>
                    ) : (
                      "🔍 Search"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {benchmark && (
              <div className="glass-hover glass rounded-2xl p-8 relative overflow-hidden shadow-3d border border-white/20 animate-scale-in">
                <div className="absolute top-0 left-0 w-2 h-full bg-linear-to-b from-purple-500 to-teal-500 rounded-r-full"></div>
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-linear-to-br from-purple-500/20 to-teal-500/20 rounded-full blur-xl"></div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold gradient-text mb-6 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Performance Benchmark
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass rounded-xl p-6 border border-green-500/30 bg-linear-to-br from-green-500/10 to-emerald-500/5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-glow"></div>
                        <div className="text-green-400 font-bold text-sm uppercase tracking-wide">
                          Indexed Query
                        </div>
                      </div>
                      <div className="text-white font-mono text-2xl font-bold">
                        {benchmark.fast_query_time}
                      </div>
                      <div className="text-green-300/70 text-xs mt-1">
                        ⚡ Optimized
                      </div>
                    </div>

                    <div className="glass rounded-xl p-6 border border-red-500/30 bg-linear-to-br from-red-500/10 to-pink-500/5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="text-red-400 font-bold text-sm uppercase tracking-wide">
                          Full Scan
                        </div>
                      </div>
                      <div className="text-white font-mono text-2xl font-bold">
                        {benchmark.slow_query_time}
                      </div>
                      <div className="text-red-300/70 text-xs mt-1">
                        🐌 Unoptimized
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 border border-white/20">
                      <span className="text-orange-400 font-bold text-sm">
                        {benchmark.diff_factor}x faster
                      </span>
                      <span className="text-xs text-gray-400">
                        with indexing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEARCH RESULTS HEADER & PAGINATION */}
            {musicList.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/20 animate-slide-in-right">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
                      <span className="text-xl">🎵</span>
                      Search Results
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="glass rounded-full px-3 py-1 border border-white/20">
                        <span className="text-teal-400 font-bold text-sm">
                          {searchTotalRecords.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">
                          tracks found
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* SEARCH PAGINATION CONTROLS */}
                  <div className="flex items-center gap-3 glass rounded-xl p-2 border border-white/20">
                    <button
                      disabled={searchPage === 1}
                      onClick={() => changeSearchPage(searchPage - 1)}
                      className="glass-hover glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium hover-scale hover-glow"
                    >
                      ← Prev
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-linear-primary bg-clip-text text-transparent font-bold">
                        {searchPage}
                      </span>
                      <span className="text-gray-500 text-sm">/</span>
                      <span className="text-gray-400 text-sm">
                        {searchTotalPages}
                      </span>
                    </div>
                    <button
                      disabled={searchPage >= searchTotalPages}
                      onClick={() => changeSearchPage(searchPage + 1)}
                      className="glass-hover glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium hover-scale hover-glow"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <TrackListRenderer
              tracks={musicList}
              highlightKeyword={query}
              pageIndex={searchPage}
            />
          </div>
        )}

        {/* --- VIEW 2: LIBRARY --- */}
        {activeTab === "library" && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="glass-hover glass rounded-2xl p-6 border border-white/20 shadow-3d">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-linear-secondary rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                    📚
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold gradient-text">
                      Music Library
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="glass rounded-full px-3 py-1 border border-white/20">
                        <span className="text-teal-400 font-bold">
                          {libTotalRecords.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">
                          total tracks
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 glass rounded-xl p-3 border border-white/20 w-full lg:w-auto">
                  <button
                    disabled={libPage === 1 || isLoadingLibrary}
                    onClick={() => fetchLibrary(libPage - 1)}
                    className="glass-hover glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium hover-scale hover-glow"
                  >
                    ← Prev
                  </button>

                  <form
                    onSubmit={handleJumpPage}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm text-gray-400 font-medium hidden sm:inline">
                      Page
                    </span>
                    <input
                      type="number"
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      className="w-16 glass border border-white/20 rounded-lg text-center font-mono text-white text-sm focus:border-teal-400 focus:outline-none py-2 transition-all duration-300"
                    />
                    <span className="text-sm text-gray-400">
                      of {libTotalPages}
                    </span>
                    <button type="submit" className="hidden"></button>
                  </form>

                  <button
                    disabled={libPage >= libTotalPages || isLoadingLibrary}
                    onClick={() => fetchLibrary(libPage + 1)}
                    className="glass-hover glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium hover-scale hover-glow"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
            {isLoadingLibrary ? (
              <div className="glass rounded-2xl p-12 border border-white/20 shadow-xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-primary rounded-2xl mb-4 animate-pulse-glow">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <div className="text-lg font-semibold gradient-text animate-pulse">
                    Loading your music library...
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Please wait while we fetch your tracks
                  </div>
                </div>
              </div>
            ) : (
              <TrackListRenderer tracks={libraryList} pageIndex={libPage} />
            )}
          </div>
        )}
      </main>
      {/* Thông báo kết nối thành công */}
      {showToast && isConnected && (
        <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce z-100 flex items-center gap-2">
          <span>✅</span>
          <span>Đã kết nối với Backend thành công!</span>
        </div>
      )}

      {/* Thông báo lỗi nếu không kết nối được (Tùy chọn) */}
      {isConnected === false && (
        <div className="fixed bottom-10 right-10 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-100 flex items-center gap-2">
          <span>❌</span>
          <span>Không thể kết nối với Backend ({API_BASE})</span>
        </div>
      )}
    </div>
  );
}
