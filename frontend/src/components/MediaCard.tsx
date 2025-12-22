import { motion } from "framer-motion";
import { Book, Film, Tv, BookOpen, Newspaper, Play, Users } from "lucide-react";
import type { MediaItem, MediaType } from "@/types";

const mediaIcons: Record<MediaType, typeof Book> = {
  book: Book,
  movie: Film,
  anime: Play,
  manga: BookOpen,
  comic: Newspaper,
  tvshow: Tv,
};

const mediaBadgeClass: Record<MediaType, string> = {
  book: "badge-book",
  movie: "badge-movie",
  anime: "badge-anime",
  manga: "badge-manga",
  comic: "badge-comic",
  tvshow: "badge-tvshow",
};

interface MediaCardProps {
  media: MediaItem;
  onClick?: () => void;
  showStats?: boolean;
}

export function MediaCard({
  media,
  onClick,
  showStats = true,
}: MediaCardProps) {
  const Icon = mediaIcons[media.type];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="nft-card rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {media.coverImage ? (
          <img
            src={media.coverImage}
            alt={media.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
            <Icon className="w-12 h-12 text-dark-500" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />

        {/* Media Type Badge */}
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium border ${
            mediaBadgeClass[media.type]
          }`}
        >
          <div className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            <span className="capitalize">{media.type}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1 group-hover:text-accent-300 transition-colors">
          {media.title}
        </h3>
        <p className="text-xs text-dark-400 mb-3">
          {media.creator} • {media.releaseYear}
        </p>

        {/* Stats */}
        {showStats && (
          <div className="flex items-center gap-3 text-xs text-dark-400">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{media.totalCompletions.toLocaleString()}</span>
            </div>
            {media.genre?.[0] && (
              <span className="px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                {media.genre[0]}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MediaCardSkeletonProps {
  count?: number;
}

export function MediaCardSkeleton({ count = 1 }: MediaCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="nft-card rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[3/4] bg-dark-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-dark-700 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-3 bg-dark-700 rounded w-12" />
              <div className="h-3 bg-dark-700 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
