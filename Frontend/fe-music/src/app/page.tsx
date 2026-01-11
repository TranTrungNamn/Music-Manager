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
  const [stats, setStats] = useState({ tracks: 0, albums: 0, artists: 0 });

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

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/music/stats`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition group shadow-lg animate-in fade-in zoom-in duration-300"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-700 rounded mb-3 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                <span className="z-10">🎵</span>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition"></div>
              </div>
              <h3
                className="font-bold text-sm truncate text-white mb-1"
                title={track.title}
              >
                <HighlightText
                  text={track.title}
                  highlight={highlightKeyword}
                />
              </h3>
              <p
                className="text-xs text-gray-400 truncate"
                title={track.album?.artist?.name}
              >
                👤{" "}
                <HighlightText
                  text={track.album?.artist?.name || "Unknown"}
                  highlight={highlightKeyword}
                />
              </p>
              <p
                className="text-[10px] text-gray-500 truncate mt-1"
                title={track.album?.title}
              >
                💿{" "}
                <HighlightText
                  text={track.album?.title || "Unknown Album"}
                  highlight={highlightKeyword}
                />
              </p>
            </div>
          ))}
        </div>
      );
    }

    // List View
    return (
      <div className="flex flex-col gap-1">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-2 rounded hover:bg-[#2a2a2a] group transition border-b border-gray-800/50"
          >
            <div className="text-gray-600 w-10 text-center text-xs font-mono">
              {(pageIndex - 1) * pageSize + index + 1}
            </div>
            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-lg">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white truncate">
                <HighlightText
                  text={track.title}
                  highlight={highlightKeyword}
                />
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>
                  <HighlightText
                    text={track.album?.artist?.name || "Unknown"}
                    highlight={highlightKeyword}
                  />
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span className="text-gray-500">
                  <HighlightText
                    text={track.album?.title}
                    highlight={highlightKeyword}
                  />
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {track.duration
                ? `${Math.floor(track.duration / 60)}:${(track.duration % 60)
                    .toString()
                    .padStart(2, "0")}`
                : "--:--"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-20">
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              Music Manager
            </h1>
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  activeTab === "search"
                    ? "bg-green-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🔍 Search
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  activeTab === "library"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📚 Library
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${
                  viewMode === "grid"
                    ? "bg-gray-700 text-green-400"
                    : "text-gray-500"
                }`}
              >
                📱
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${
                  viewMode === "list"
                    ? "bg-gray-700 text-green-400"
                    : "text-gray-500"
                }`}
              >
                📃
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
              <input
                type="number"
                value={seedCountInput}
                onChange={(e) => setSeedCountInput(Number(e.target.value))}
                disabled={seedStep !== 0}
                className="bg-transparent text-right font-mono text-green-400 font-bold w-20 outline-none"
              />
              <button
                onClick={handleSeed}
                disabled={seedStep === 2}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  seedStep === 0
                    ? "bg-green-700"
                    : seedStep === 1
                    ? "bg-red-600 animate-pulse"
                    : "bg-gray-800"
                }`}
              >
                {seedStep === 0
                  ? "Seed DB"
                  : seedStep === 1
                  ? "Confirm?"
                  : `${seedProgress}%`}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* --- VIEW 1: SEARCH --- */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 shadow-lg shadow-green-900/10">
              {/* FILTER DROPDOWN */}
              <select
                value={searchFilter}
                onChange={(e) =>
                  setSearchFilter(e.target.value as SearchFilterType)
                }
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-4 font-bold min-w-[150px]"
              >
                <option value="all">🌐 All Fields</option>
                <option value="title">🎵 Track Name</option>
                <option value="artist">👤 Artist</option>
                <option value="album">💿 Album</option>
              </select>

              <div className="flex-1 flex">
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && executeNewSearch()}
                  className="flex-1 bg-[#1e1e1e] border border-gray-700 rounded-l-lg px-6 py-4 text-lg focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={executeNewSearch}
                  className="bg-green-600 hover:bg-green-500 text-black font-bold px-8 rounded-r-lg text-lg"
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
            </div>

            {benchmark && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="flex gap-10">
                  <div>
                    <div className="text-green-400 font-bold text-xs">
                      INDEX SCAN
                    </div>
                    <div className="text-white font-mono text-xl">
                      {benchmark.fast_query_time}
                    </div>
                  </div>
                  <div>
                    <div className="text-red-400 font-bold text-xs">
                      FULL SCAN
                    </div>
                    <div className="text-white font-mono text-xl">
                      {benchmark.slow_query_time}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEARCH RESULTS HEADER & PAGINATION */}
            {musicList.length > 0 && (
              <div className="flex justify-between items-end border-b border-gray-800 pb-2 mt-2">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Search Results
                  </h2>
                  <span className="text-gray-500 text-sm">
                    Found {searchTotalRecords.toLocaleString()} tracks
                  </span>
                </div>

                {/* SEARCH PAGINATION CONTROLS */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={searchPage === 1}
                    onClick={() => changeSearchPage(searchPage - 1)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 text-xs"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-mono">
                    Page {searchPage} / {searchTotalPages}
                  </span>
                  <button
                    disabled={searchPage >= searchTotalPages}
                    onClick={() => changeSearchPage(searchPage + 1)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30 text-xs"
                  >
                    Next
                  </button>
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
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                  📚
                </div>
                <div>
                  <h2 className="text-lg font-bold">Library</h2>
                  <p className="text-xs text-gray-400">
                    Total {libTotalRecords.toLocaleString()} tracks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-gray-700">
                <button
                  disabled={libPage === 1 || isLoadingLibrary}
                  onClick={() => fetchLibrary(libPage - 1)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  ←
                </button>
                <form
                  onSubmit={handleJumpPage}
                  className="flex items-center gap-2 px-2"
                >
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    Page
                  </span>
                  <input
                    type="number"
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="w-16 bg-gray-800 border border-gray-600 rounded text-center font-mono text-white text-sm focus:border-green-500 focus:outline-none py-1"
                  />
                  <span className="text-xs text-gray-500">
                    / {libTotalPages}
                  </span>
                  <button type="submit" className="hidden"></button>
                </form>
                <button
                  disabled={libPage >= libTotalPages || isLoadingLibrary}
                  onClick={() => fetchLibrary(libPage + 1)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
            {isLoadingLibrary ? (
              <div className="text-center py-20 animate-pulse text-gray-500">
                Loading...
              </div>
            ) : (
              <TrackListRenderer tracks={libraryList} pageIndex={libPage} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
