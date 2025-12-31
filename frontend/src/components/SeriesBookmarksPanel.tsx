import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bookmark, RefreshCw, Trash2, ExternalLink } from "lucide-react";

interface SeriesBookmark {
  id: string;
  title: string;
  url: string;
  currentChapter?: string;
  status?: string;
  hasUpdate?: boolean;
  latestEpisode?: string;
  lastChecked?: string;
}

export function SeriesBookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<SeriesBookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SeriesBookmark | null>(null);

  const filterUnique = useCallback((items: SeriesBookmark[]) => {
    const normalize = (url: string) => {
      try {
        const u = new URL(url);
        return (u.hostname + u.pathname).replace(/\/$/, "").toLowerCase();
      } catch {
        return url.toLowerCase();
      }
    };
    return items.filter(
      (b, index, self) =>
        index ===
        self.findIndex(
          (t) => normalize(t.url) === normalize(b.url) || t.title === b.title
        )
    );
  }, []);

  const load = useCallback(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;
    chrome.storage.local.get(["seriesBookmarks"], (r) => {
      const raw = r.seriesBookmarks || [];
      setBookmarks(filterUnique(raw));
    });
  }, [filterUnique]);

  useEffect(() => {
    load();
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      const handler = (
        changes: { [key: string]: chrome.storage.StorageChange },
        area: string
      ) => {
        if (area === "local" && changes.seriesBookmarks) {
          const raw = changes.seriesBookmarks.newValue || [];
          setBookmarks(filterUnique(raw));
        }
      };
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    }
  }, [load, filterUnique]);

  const checkUpdates = async () => {
    if (!bookmarks.length) return;
    setLoading(true);
    try {
      await chrome.runtime.sendMessage({ type: "CHECK_SERIES_UPDATES" });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = (id: string) => {
    const next = bookmarks.filter((b) => b.id !== id);
    chrome.storage.local.set({ seriesBookmarks: next });
  };

  const markAsRead = (b: SeriesBookmark) => {
    const next = bookmarks.map((x) =>
      x.id === b.id
        ? {
            ...x,
            currentChapter: b.latestEpisode || x.currentChapter,
            hasUpdate: false,
          }
        : x
    );
    chrome.storage.local.set({ seriesBookmarks: next }, () =>
      setSelected(null)
    );
  };

  if (!bookmarks.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-coral" />
          <h2 className="text-base font-semibold text-white">
            Series Bookmarks
          </h2>
        </div>
        <button
          onClick={checkUpdates}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-dark-800 text-white hover:bg-dark-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {loading ? "Checking..." : "Check updates"}
        </button>
      </div>

      <div className="card space-y-3">
        {bookmarks.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{b.title}</p>
              <p className="text-xs text-dark-400">
                {b.status || "Reading"}
                {b.currentChapter ? ` • Ch. ${b.currentChapter}` : ""}
                {b.hasUpdate ? " • Update available" : ""}
              </p>
              {b.lastChecked && (
                <p className="text-xs text-dark-500">
                  Last checked: {new Date(b.lastChecked).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelected(b)}
              className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-xs"
              title="Details"
            >
              Details
            </button>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-coral text-xs"
              title="Open"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => removeBookmark(b.id)}
              className="px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-red-400 text-xs"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelected(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-dark-900 rounded-2xl border border-dark-700 p-5 w-full max-w-sm relative z-[151]"
          >
            <h3 className="text-base font-semibold text-white mb-2">
              Series Details
            </h3>
            <p className="text-xs text-dark-400 mb-3 truncate">
              {selected.title}
            </p>
            <div className="space-y-2 text-xs">
              <p className="text-dark-300">
                Current: {selected.currentChapter || "—"}
              </p>
              <p className="text-dark-300">
                Latest detected: {selected.latestEpisode || "—"}
              </p>
              <p className="text-dark-500">
                Last checked:{" "}
                {selected.lastChecked
                  ? new Date(selected.lastChecked).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => markAsRead(selected)}
                className="flex-1 py-2 rounded-xl bg-coral text-white text-xs"
              >
                Mark as read
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2 rounded-xl bg-dark-700 text-dark-300 text-xs"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
