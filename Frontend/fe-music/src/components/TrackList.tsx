// src/components/TrackList.tsx
import React from "react";
import { Track } from "@/types/music";
import { HighlightText } from "./HighlightText";

interface TrackListProps {
  tracks: Track[];
  viewMode: "grid" | "list";
  highlightKeyword?: string;
  pageIndex: number;
  pageSize?: number;
}

export const TrackList = ({
  tracks,
  viewMode,
  highlightKeyword,
  pageIndex,
  pageSize = 20,
}: TrackListProps) => {
  if (tracks.length === 0)
    return (
      <div className="text-center text-gray-500 py-10">No data found.</div>
    );

  // --- GRID VIEW ---
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="card-3d glass-hover glass rounded-2xl p-5 border border-white/10 shadow-xl group animate-bounce-in hover-lift"
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: "both",
            }}
          >
            <div className="aspect-square bg-linear-to-br from-purple-500/20 via-teal-500/20 to-orange-500/20 rounded-xl mb-4 flex items-center justify-center text-5xl shadow-inner relative overflow-hidden">
              <span className="z-10 drop-shadow-lg">🎵</span>
              <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                {/* ✅ SỬA: Dùng artistName thay vì album.artist.name */}
                <p
                  className="text-xs text-gray-300 truncate flex items-center gap-1"
                  title={track.artistName}
                >
                  <span className="text-teal-400">👤</span>
                  <HighlightText
                    text={track.artistName || "Unknown"}
                    highlight={highlightKeyword}
                  />
                </p>
                {/* ✅ SỬA: Dùng albumTitle thay vì album.title */}
                <p
                  className="text-[10px] text-gray-400 truncate flex items-center gap-1"
                  title={track.albumTitle}
                >
                  <span className="text-orange-400">💿</span>
                  <HighlightText
                    text={track.albumTitle || "Unknown Album"}
                    highlight={highlightKeyword}
                  />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="glass-hover glass flex items-center gap-4 p-4 rounded-xl border border-white/10 shadow-lg hover-glow hover-lift animate-slide-in-right group"
          style={{
            animationDelay: `${index * 0.05}s`,
            animationFillMode: "both",
          }}
        >
          <div className="glass w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-teal-400 border border-white/20">
            {(pageIndex - 1) * pageSize + index + 1}
          </div>

          <div className="w-12 h-12 bg-linear-to-br from-purple-500/20 to-teal-500/20 rounded-lg flex items-center justify-center text-xl shadow-inner">
            🎵
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-white truncate mb-1">
              <HighlightText text={track.title} highlight={highlightKeyword} />
            </div>
            <div className="text-sm text-gray-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="text-teal-400 text-xs">👤</span>
                {/* ✅ SỬA: Dùng artistName */}
                <HighlightText
                  text={track.artistName || "Unknown"}
                  highlight={highlightKeyword}
                />
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
              <span className="flex items-center gap-1">
                <span className="text-orange-400 text-xs">💿</span>
                <span className="text-gray-400">
                  {/* ✅ SỬA: Dùng albumTitle */}
                  <HighlightText
                    text={track.albumTitle || "Unknown Album"}
                    highlight={highlightKeyword}
                  />
                </span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
