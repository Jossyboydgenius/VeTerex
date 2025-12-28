import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  ArrowLeft,
  Play,
  Film,
  Tv,
  Book,
  BookOpen,
  ExternalLink,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAppStore, type TrackedMedia } from "@/store/useAppStore";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

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

export function MintPage() {
  const navigate = useNavigate();
  const { isConnected, addToast, pendingMints, removePendingMint } =
    useAppStore();
  const [mediaToMint, setMediaToMint] = useState<TrackedMedia | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  // Load pending mint data from chrome storage
  useEffect(() => {
    if (isExtension) {
      chrome.storage?.local?.get(["pendingMint"], (result) => {
        if (result.pendingMint) {
          setMediaToMint({
            id: `mint-${Date.now()}`,
            platform: result.pendingMint.platform || "unknown",
            type: result.pendingMint.type || "video",
            title: result.pendingMint.title || "Unknown Media",
            url: result.pendingMint.url || "",
            progress: 100,
            watchTime: result.pendingMint.watchTime || 0,
            thumbnail: result.pendingMint.thumbnail || "",
            completed: true,
            startTime: result.pendingMint.startTime || Date.now(),
            lastUpdate: Date.now(),
          });
          // Clear pendingMint from storage
          chrome.storage.local.remove(["pendingMint"]);
        }
      });
    }

    // Also check if there are pending mints in the store
    if (pendingMints.length > 0 && !mediaToMint) {
      setMediaToMint(pendingMints[0]);
    }
  }, [pendingMints]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleMint = async () => {
    if (!isConnected) {
      addToast({
        type: "error",
        message: "Please connect your wallet first",
      });
      return;
    }

    setIsMinting(true);

    // Simulate minting process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsMinting(false);
    setMintSuccess(true);

    // Remove from pending mints if it exists
    if (mediaToMint) {
      removePendingMint(mediaToMint.id);
    }

    addToast({
      type: "success",
      message: "NFT minted successfully! 🎉",
    });

    // Navigate to collection after a delay
    setTimeout(() => {
      navigate("/collection");
    }, 2000);
  };

  const handleLater = () => {
    // Keep in pending mints for later
    addToast({
      type: "info",
      message: "Saved for later. You can mint from your Collection page.",
    });
    navigate("/");
  };

  const Icon = typeIcons[mediaToMint?.type || "video"] || Play;
  const colorClass =
    platformColors[mediaToMint?.platform || "default"] ||
    platformColors.default;

  // Show empty state if no media to mint
  if (!mediaToMint) {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
          <Award className="w-10 h-10 text-dark-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Nothing to Mint</h2>
        <p className="text-dark-400 text-sm text-center mb-6">
          Complete watching content to mint NFT badges
        </p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-white hover:bg-dark-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Mint Achievement NFT</h1>
      </div>

      {/* Success State */}
      {mintSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">NFT Minted!</h2>
          <p className="text-dark-400">
            Your achievement has been recorded on the blockchain
          </p>
        </motion.div>
      ) : (
        <>
          {/* Media Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div
                className={`w-20 h-20 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
              >
                {mediaToMint.thumbnail ? (
                  <img
                    src={mediaToMint.thumbnail}
                    alt={mediaToMint.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Icon className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-lg mb-1 truncate">
                  {mediaToMint.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                  <span className="capitalize">{mediaToMint.platform}</span>
                  <span>•</span>
                  <span className="capitalize">{mediaToMint.type}</span>
                </div>
                {mediaToMint.watchTime > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-dark-400">
                    <Clock className="w-4 h-4" />
                    <span>Watched: {formatTime(mediaToMint.watchTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Link to content */}
            {mediaToMint.url && (
              <a
                href={mediaToMint.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View original content
              </a>
            )}
          </motion.div>

          {/* NFT Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-sm font-medium text-dark-400 mb-4">
              NFT Preview
            </h3>
            <div className="relative aspect-square rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4`}
                >
                  <Award className="w-12 h-12 text-white" />
                </div>
                <p className="text-white font-semibold text-center mb-1 truncate max-w-full px-4">
                  {mediaToMint.title}
                </p>
                <p className="text-dark-400 text-sm capitalize">
                  {mediaToMint.type} • {mediaToMint.platform}
                </p>
                <div className="mt-4 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                  ✓ Completed
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-accent-500/50" />
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500/50" />
              <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-primary-500/50" />
              <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-accent-500/50" />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <button
              onClick={handleMint}
              disabled={isMinting || !isConnected}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl
                       bg-gradient-to-r from-accent-500 to-primary-500 
                       text-white font-semibold text-lg
                       hover:from-accent-400 hover:to-primary-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  Mint NFT
                </>
              )}
            </button>

            <button
              onClick={handleLater}
              disabled={isMinting}
              className="w-full py-3 px-4 rounded-xl
                       bg-dark-800 border border-dark-600
                       text-dark-300 font-medium
                       hover:bg-dark-700 hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Save for Later
            </button>

            {!isConnected && (
              <p className="text-center text-sm text-yellow-500">
                Connect your wallet to mint NFTs
              </p>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
