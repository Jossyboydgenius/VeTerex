import { motion } from "framer-motion";
import {
  Play,
  Book,
  Film,
  Tv,
  BookOpen,
  ExternalLink,
  Award,
  Clock,
} from "lucide-react";
import type { TrackedMedia } from "@/store/useAppStore";

interface TrackedMediaCardProps {
  media: TrackedMedia;
  onMint?: () => void;
  onDismiss?: () => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Play,
  movie: Film,
  tvshow: Tv,
  anime: Play,
  book: Book,
  manga: BookOpen,
};

const platformColors: Record<string, string> = {
  youtube: "from-red-500 to-red-600",
  netflix: "from-red-600 to-red-700",
  primevideo: "from-blue-500 to-blue-600",
  disneyplus: "from-blue-700 to-indigo-600",
  crunchyroll: "from-orange-500 to-orange-600",
  hulu: "from-green-500 to-green-600",
  goodreads: "from-amber-600 to-amber-700",
  mangadex: "from-orange-400 to-orange-500",
  default: "from-accent-500 to-primary-500",
};

export function TrackedMediaCard({
  media,
  onMint,
  onDismiss,
}: TrackedMediaCardProps) {
  const Icon = typeIcons[media.type] || Play;
  const colorClass = platformColors[media.platform] || platformColors.default;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const total = formatTime(media.duration || 0);

  const formatTimestamp = (
    timestamp: number | string | undefined
  ): string | null => {
    if (!timestamp) return null;

    // Handle ISO string timestamps
    const time =
      typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;

    if (!time || isNaN(time)) return null;

    const now = Date.now();
    const diff = now - time;

    // If diff is negative or too large, it's invalid
    if (diff < 0 || diff > 365 * 24 * 60 * 60 * 1000) return null;

    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card overflow-hidden"
    >
      <div className="flex gap-4">
        {/* Thumbnail/Icon */}
        <div
          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
        >
          {media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Icon className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-white truncate text-sm">
              {media.title}
            </h3>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-400 hover:text-accent-400 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-400 mb-2">
            <span className="capitalize">{media.platform}</span>
            <span>•</span>
            <span className="capitalize">{media.type}</span>
            {formatTimestamp(media.lastUpdate) && (
              <>
                <span>•</span>
                <span>{formatTimestamp(media.lastUpdate)}</span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-dark-400">Progress</span>
              <span className="text-white font-medium">
                {Math.round(media.progress)}%
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${media.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Watch Time */}
          {formatTime(media.watchTime) && (
            <div className="flex items-center gap-1.5 text-xs text-dark-400">
              <Clock className="w-3 h-3" />
              <span>Watched: {formatTime(media.watchTime)}</span>
            </div>
          )}

          {/* Duration */}
          {total && (
            <div className="flex items-center gap-1.5 text-xs text-dark-400 mt-1">
              <Clock className="w-3 h-3" />
              <span>Duration: {total}</span>
            </div>
          )}
        </div>
      </div>

      {/* Completed State */}
      {media.completed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-dark-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">Completed!</span>
            </div>
            <div className="flex gap-2">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 text-xs text-dark-400 hover:text-white 
                           bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  Dismiss
                </button>
              )}
              {onMint && (
                <button
                  onClick={onMint}
                  className="px-4 py-1.5 text-xs font-medium text-white 
                           bg-gradient-to-r from-accent-500 to-primary-500 
                           rounded-lg hover:from-accent-400 hover:to-primary-400 
                           transition-all duration-200 flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  Mint NFT
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
