import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Users,
  Calendar,
  ExternalLink,
  Book,
  Film,
  Tv,
  Play,
  BookOpen,
  Newspaper,
  Sparkles,
  Check,
} from "lucide-react";
import type { MediaItem, MediaType } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { MintNFTModal } from "@/components/MintNFTModal";

const mediaIcons: Record<MediaType, typeof Book> = {
  book: Book,
  movie: Film,
  anime: Play,
  manga: BookOpen,
  comic: Newspaper,
  tvshow: Tv,
};

// Mock data - in real app this would come from API
const mockMediaData: Record<string, MediaItem> = {
  "1": {
    id: "1",
    externalId: "tt0111161",
    title: "The Shawshank Redemption",
    type: "movie",
    description:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency. Chronicles the experiences of a formerly successful banker as a prisoner in the gloomy jailhouse of Shawshank after being found guilty of a crime he did not commit.",
    coverImage:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    releaseYear: 1994,
    creator: "Frank Darabont",
    genre: ["Drama", "Crime"],
    totalCompletions: 2453,
    metadata: {
      duration: "142 min",
      rating: "9.3/10",
      imdb: "tt0111161",
    },
  },
  "2": {
    id: "2",
    externalId: "978-0-06-112008-4",
    title: "To Kill a Mockingbird",
    type: "book",
    description:
      "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Through the young eyes of Scout and Jem Finch, Harper Lee explores the irrationality of adult attitudes toward race and class in the Deep South.",
    coverImage:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    releaseYear: 1960,
    creator: "Harper Lee",
    genre: ["Classic", "Fiction", "Historical"],
    totalCompletions: 1892,
    metadata: {
      pages: "281",
      isbn: "978-0-06-112008-4",
    },
  },
  "3": {
    id: "3",
    externalId: "21",
    title: "Death Note",
    type: "anime",
    description:
      "A high school student named Light Yagami discovers a supernatural notebook that allows him to kill anyone whose name he writes in it. As Light uses the notebook to create a utopia without criminals, he attracts the attention of a legendary detective known only as L.",
    coverImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop",
    releaseYear: 2006,
    creator: "Madhouse",
    genre: ["Thriller", "Supernatural", "Psychological"],
    totalCompletions: 3241,
    metadata: {
      episodes: "37",
      malId: "21",
    },
  },
};

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, completions, addToast } = useAppStore();

  const [media, setMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMintModal, setShowMintModal] = useState(false);

  // Check if user has already completed this
  const hasCompleted = completions.some((c) => c.mediaId === id);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (id && mockMediaData[id]) {
        setMedia(mockMediaData[id]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-dark-400">Media not found</p>
        <button
          onClick={() => navigate("/explore")}
          className="mt-4 btn-secondary"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  const Icon = mediaIcons[media.type];

  return (
    <>
      <div className="pb-24">
        {/* Header Image */}
        <div className="relative h-64">
          {media.coverImage ? (
            <img
              src={media.coverImage}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-xl glass-dark hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Completed Badge */}
          {hasCompleted && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green/20 border border-brand-green/30">
              <Check className="w-4 h-4 text-brand-green" />
              <span className="text-sm font-medium text-brand-green">
                Completed
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 -mt-16 relative z-10 space-y-6">
          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Type Badge */}
            <div
              className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mb-3
              ${media.type === "book" ? "badge-book" : ""}
              ${media.type === "movie" ? "badge-movie" : ""}
              ${media.type === "anime" ? "badge-anime" : ""}
              ${media.type === "manga" ? "badge-manga" : ""}
              ${media.type === "comic" ? "badge-comic" : ""}
              ${media.type === "tvshow" ? "badge-tvshow" : ""}
              border
            `}
            >
              <Icon className="w-3 h-3" />
              <span className="capitalize">{media.type}</span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              {media.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-dark-400">
              <span>{media.creator}</span>
              <span>•</span>
              <span>{media.releaseYear}</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-4"
          >
            <div className="flex-1 card text-center py-4">
              <Users className="w-5 h-5 mx-auto text-coral mb-1" />
              <p className="text-lg font-bold text-white">
                {media.totalCompletions.toLocaleString()}
              </p>
              <p className="text-xs text-dark-400">Completions</p>
            </div>

            {media.metadata?.rating && (
              <div className="flex-1 card text-center py-4">
                <Star className="w-5 h-5 mx-auto text-brand-yellow mb-1" />
                <p className="text-lg font-bold text-white">
                  {media.metadata.rating}
                </p>
                <p className="text-xs text-dark-400">Rating</p>
              </div>
            )}

            <div className="flex-1 card text-center py-4">
              <Calendar className="w-5 h-5 mx-auto text-violet mb-1" />
              <p className="text-lg font-bold text-white">
                {media.releaseYear}
              </p>
              <p className="text-xs text-dark-400">Released</p>
            </div>
          </motion.div>

          {/* Genres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {media.genre.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 rounded-full bg-dark-800 text-sm text-dark-300"
              >
                {genre}
              </span>
            ))}
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-white mb-2">About</h2>
            <p className="text-dark-400 text-sm leading-relaxed">
              {media.description}
            </p>
          </motion.div>

          {/* Metadata */}
          {media.metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-lg font-semibold text-white mb-3">Details</h2>
              <div className="space-y-2">
                {Object.entries(media.metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 border-b border-dark-800"
                  >
                    <span className="text-dark-400 capitalize">{key}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* External Link */}
          {media.externalId && (
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              href={
                media.type === "movie" || media.type === "tvshow"
                  ? `https://www.imdb.com/title/${media.externalId}`
                  : media.type === "anime" || media.type === "manga"
                  ? `https://myanimelist.net/anime/${media.externalId}`
                  : `https://www.google.com/search?q=isbn+${media.externalId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-3 hover:border-coral/50"
            >
              <ExternalLink className="w-5 h-5 text-coral" />
              <span className="text-dark-300">
                View on{" "}
                {media.type === "movie" || media.type === "tvshow"
                  ? "IMDB"
                  : media.type === "anime" || media.type === "manga"
                  ? "MyAnimeList"
                  : "Google Books"}
              </span>
            </motion.a>
          )}
        </div>

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!isConnected) {
                addToast({
                  type: "error",
                  message: "Please connect your wallet first",
                });
                return;
              }
              if (hasCompleted) {
                addToast({
                  type: "info",
                  message: "You have already completed this!",
                });
                return;
              }
              setShowMintModal(true);
            }}
            disabled={hasCompleted}
            className={`
              w-full py-4 rounded-2xl font-semibold text-white
              flex items-center justify-center gap-2
              transition-all duration-200
              ${
                hasCompleted
                  ? "bg-brand-green/20 border border-brand-green/30 cursor-default"
                  : "bg-main-gradient shadow-lg shadow-coral/30 hover:shadow-coral/50"
              }
            `}
          >
            {hasCompleted ? (
              <>
                <Check className="w-5 h-5" />
                <span>Already Completed</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Mark as Completed & Mint NFT</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Mint Modal */}
      <MintNFTModal
        media={media}
        isOpen={showMintModal}
        onClose={() => setShowMintModal(false)}
        onSuccess={() => {
          // Refresh or update state
        }}
      />
    </>
  );
}
