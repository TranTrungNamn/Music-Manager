import React from "react";

interface HeaderProps {
  activeTab: "search" | "library";
  setActiveTab: (tab: "search" | "library") => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  currentTheme: string;
  toggleTheme: () => void;
  seedCountInput: number;
  setSeedCountInput: (val: number) => void;
  seedStep: number;
  seedProgress: number;
  handleSeed: () => void;
}

export const Header = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  currentTheme,
  toggleTheme,
  seedCountInput,
  setSeedCountInput,
  seedStep,
  seedProgress,
  handleSeed,
}: HeaderProps) => {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50 shadow-3d backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* LOGO & TABS */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-primary flex items-center justify-center shadow-lg">
              <span className="text-xl">🎵</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Music Manager</h1>
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

        {/* CONTROLS RIGHT */}
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

          <button
            onClick={toggleTheme}
            className="glass-hover glass w-12 h-12 rounded-xl border border-white/20 shadow-lg flex items-center justify-center text-xl hover-rotate hover-glow group"
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
                  ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  : seedStep === 1
                    ? "bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg animate-pulse"
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
  );
};
