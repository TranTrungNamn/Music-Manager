"use client";
import { useState, useEffect } from "react";
import { Track, BenchmarkResult } from "@/types/music";
import { Header } from "@/components/Header";
import { TrackList } from "@/components/TrackList";
import { BenchmarkTable } from "@/components/BenchmarkTable";

const API_BASE = "http://localhost:4000";
type SearchFilterType = "all" | "title" | "artist" | "album";

export default function Dashboard() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"search" | "library">("search");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Search State
  const [musicList, setMusicList] = useState<Track[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [query, setQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotalRecords, setSearchTotalRecords] = useState(0);
  const [searchLimit, setSearchLimit] = useState(20);
  const [searchJumpPageInput, setSearchJumpPageInput] = useState("1");
  const [isDemoMode, setIsDemoMode] = useState(false); // Toggle Demo

  // Library State
  const [libraryList, setLibraryList] = useState<Track[]>([]);
  const [libPage, setLibPage] = useState(1);
  const [libTotalPages, setLibTotalPages] = useState(1);
  const [libTotalRecords, setLibTotalRecords] = useState(0);
  const [libLimit, setLibLimit] = useState(20);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libJumpPageInput, setLibJumpPageInput] = useState("1");

  // Seed State
  const [seedStep, setSeedStep] = useState(0);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedCountInput, setSeedCountInput] = useState(1000000);

  // --- EFFECTS ---
  useEffect(() => {
    fetchStats();
    if (activeTab === "library") fetchLibrary(1, libLimit);
  }, [activeTab]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("music-manager-theme") || "dark";
    applyTheme(savedTheme as any);
  }, []);

  const applyTheme = (theme: "dark" | "light" | "cyber") => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("music-manager-theme", theme);
  };

  const toggleTheme = () => {
    const themes = ["dark", "light", "cyber"];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    applyTheme(themes[nextIndex] as any);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/music/stats`);
      if (res.ok) {
        setIsConnected(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else setIsConnected(false);
    } catch {
      setIsConnected(false);
    }
  };

  // --- HANDLERS ---
  const handleSearch = async (
    keyword: string,
    pageNum = 1,
    filterType = searchFilter,
    limit = searchLimit,
  ) => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    if (pageNum === 1) setBenchmark(null);

    try {
      const url = `${API_BASE}/music/search-smart?q=${keyword}&filter=${filterType}&page=${pageNum}&limit=${limit}&benchmark=${isDemoMode}`;
      const res = await fetch(url);
      const result = await res.json();

      setMusicList(Array.isArray(result.data) ? result.data : []);
      if (result.meta) {
        setSearchTotalPages(result.meta.lastPage);
        setSearchTotalRecords(result.meta.total);
        setSearchPage(result.meta.page);
        setSearchJumpPageInput(result.meta.page.toString());
      }
      if (result.benchmark) setBenchmark(result.benchmark);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const executeNewSearch = () => {
    setSearchPage(1);
    handleSearch(query, 1, searchFilter, searchLimit);
  };

  // Search Control Handlers
  const handleSearchLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchLimit(parseInt(e.target.value));
  };
  const applySearchLimitChange = () => {
    if (query) handleSearch(query, 1, searchFilter, searchLimit);
  };
  const handleSearchJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(searchJumpPageInput);
    if (p > 0 && p <= searchTotalPages)
      handleSearch(query, p, searchFilter, searchLimit);
  };

  // Library Handlers
  const fetchLibrary = async (pageNum: number, limit: number = libLimit) => {
    if (pageNum < 1) pageNum = 1;
    setIsLoadingLibrary(true);
    try {
      const res = await fetch(
        `${API_BASE}/music/all?page=${pageNum}&limit=${limit}`,
      );
      const data = await res.json();
      setLibraryList(data.data);
      setLibTotalPages(data.lastPage);
      setLibTotalRecords(data.total);
      setLibPage(Number(data.page));
      setLibJumpPageInput(data.page.toString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };
  const handleLibLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLibLimit(parseInt(e.target.value));
  };
  const applyLibLimitChange = () => fetchLibrary(1, libLimit);
  const handleSeed = () => {
    if (seedStep === 0) setSeedStep(1);
    else if (seedStep === 1) {
      setSeedStep(2);
      fetch(`${API_BASE}/benchmark/seed?count=${seedCountInput}`).catch(
        console.error,
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
            alert("✅ Done!");
          }
        } catch {
          clearInterval(interval);
          setSeedStep(0);
        }
      }, 1000);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen text-white font-sans pb-20 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-linear-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-float"></div>
      </div>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
        seedCountInput={seedCountInput}
        setSeedCountInput={setSeedCountInput}
        seedStep={seedStep}
        seedProgress={seedProgress}
        handleSeed={handleSeed}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* === VIEW 1: SEARCH === */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="glass-hover glass rounded-2xl p-6 shadow-3d border border-white/20">
              {/* Demo Mode Toggle */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDemoMode}
                      onChange={() => setIsDemoMode(!isDemoMode)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300 transition-colors">
                      {isDemoMode
                        ? "🔥 Demo Mode (Benchmarking ON)"
                        : "⚡ Fast Mode (Default)"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Search Inputs */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={searchFilter}
                  onChange={(e) =>
                    setSearchFilter(e.target.value as SearchFilterType)
                  }
                  className="glass-hover glass w-full md:w-48 bg-transparent border border-white/20 text-white rounded-xl p-4 font-semibold outline-none"
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
                  {/* ✅ ĐÃ THÊM LẠI OPTION ALBUM */}
                  <option value="album" className="bg-gray-800">
                    💿 Album
                  </option>
                </select>

                <div className="flex-1 flex shadow-2xl rounded-xl overflow-hidden">
                  <input
                    type="text"
                    placeholder="Search music..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && executeNewSearch()}
                    disabled={isSearching}
                    className="flex-1 bg-linear-to-r from-white/5 to-white/10 backdrop-blur-sm border-r border-white/10 px-6 py-4 text-lg focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                  />
                  <button
                    onClick={executeNewSearch}
                    disabled={isSearching}
                    className="bg-linear-primary hover:bg-linear-secondary text-white font-bold px-8 py-4 text-lg min-w-[160px] flex justify-center items-center disabled:opacity-70 transition-all"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "🔍 Search"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ BẢNG BÁO CÁO (Nằm ngay dưới Search) */}
            <BenchmarkTable benchmark={benchmark} />

            {/* Pagination & Limit */}
            {musicList.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/20 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <h2 className="text-2xl font-bold gradient-text">Results</h2>
                  <span className="glass rounded-full px-3 py-1 border border-white/20 text-xs text-gray-400">
                    <strong className="text-teal-400">
                      {searchTotalRecords.toLocaleString()}
                    </strong>{" "}
                    tracks found {/* ✅ Đã sửa thành "tracks found" */}
                  </span>
                  <div
                    className={`glass rounded-full px-3 py-1 border border-white/20 flex items-center gap-2 ${
                      isSearching ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-gray-400 text-xs">Limit:</span>
                    <input
                      type="number"
                      value={searchLimit}
                      onChange={handleSearchLimitChange}
                      onKeyDown={(e) =>
                        e.key === "Enter" && applySearchLimitChange()
                      }
                      onBlur={applySearchLimitChange}
                      disabled={isSearching}
                      className="w-10 bg-transparent text-white font-bold text-center outline-none border-b border-transparent focus:border-teal-400 text-sm disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                  <button
                    disabled={searchPage === 1 || isSearching}
                    onClick={() =>
                      handleSearch(
                        query,
                        searchPage - 1,
                        searchFilter,
                        searchLimit,
                      )
                    }
                    className="glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  <input
                    type="number"
                    value={searchJumpPageInput}
                    onChange={(e) => setSearchJumpPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchJumpPage(e);
                    }}
                    disabled={isSearching}
                    className="w-12 glass border border-white/20 rounded-lg text-center text-sm py-1 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-400">
                    / {searchTotalPages}
                  </span>
                  <button
                    disabled={searchPage >= searchTotalPages || isSearching}
                    onClick={() =>
                      handleSearch(
                        query,
                        searchPage + 1,
                        searchFilter,
                        searchLimit,
                      )
                    }
                    className="glass px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            <TrackList
              tracks={musicList}
              viewMode={viewMode}
              highlightKeyword={query}
              pageIndex={searchPage}
              pageSize={searchLimit}
            />
          </div>
        )}

        {/* === VIEW 2: LIBRARY === */}
        {activeTab === "library" && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="glass rounded-2xl p-6 border border-white/20 shadow-3d flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="w-12 h-12 bg-linear-secondary rounded-xl flex items-center justify-center text-xl shadow-lg">
                  📚
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h2 className="text-2xl font-bold gradient-text">Library</h2>
                  <div className="flex items-center gap-2">
                    <span className="glass rounded-full px-3 py-1 border border-white/20 text-xs text-gray-400">
                      <strong className="text-teal-400 text-sm">
                        {libTotalRecords.toLocaleString()}
                      </strong>{" "}
                      tracks
                    </span>
                    <div className="glass rounded-full px-3 py-1 border border-white/20 flex items-center gap-2 group focus-within:border-teal-400 transition-colors">
                      <span className="text-gray-400 text-xs">Limit:</span>
                      <input
                        type="number"
                        value={libLimit}
                        onChange={handleLibLimitChange}
                        onKeyDown={(e) =>
                          e.key === "Enter" && applyLibLimitChange()
                        }
                        onBlur={applyLibLimitChange}
                        className="w-10 bg-transparent text-white font-bold text-center outline-none border-b border-transparent focus:border-teal-400 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  disabled={libPage === 1 || isLoadingLibrary}
                  onClick={() => fetchLibrary(libPage - 1, libLimit)}
                  className="glass px-4 py-2 rounded-lg disabled:opacity-30"
                >
                  ←
                </button>
                <input
                  type="number"
                  value={libJumpPageInput}
                  onChange={(e) => setLibJumpPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const p = parseInt(libJumpPageInput);
                      if (!isNaN(p) && p > 0) fetchLibrary(p, libLimit);
                    }
                  }}
                  className="w-12 glass border border-white/20 rounded-lg text-center font-mono text-white text-sm focus:border-teal-400 focus:outline-none py-1"
                />
                <span className="text-sm text-gray-400">
                  of {libTotalPages}
                </span>
                <button
                  disabled={libPage >= libTotalPages || isLoadingLibrary}
                  onClick={() => fetchLibrary(libPage + 1, libLimit)}
                  className="glass px-4 py-2 rounded-lg disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
            {isLoadingLibrary ? (
              <div className="text-center py-10">
                <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-teal-400 rounded-full animate-spin mb-2"></div>
                <p className="text-gray-400 animate-pulse">
                  Loading Library...
                </p>
              </div>
            ) : (
              <TrackList
                tracks={libraryList}
                viewMode={viewMode}
                pageIndex={libPage}
                pageSize={libLimit}
              />
            )}
          </div>
        )}
      </main>

      {showToast && isConnected && (
        <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce z-100">
          ✅ Đã kết nối với Backend!
        </div>
      )}
    </div>
  );
}
