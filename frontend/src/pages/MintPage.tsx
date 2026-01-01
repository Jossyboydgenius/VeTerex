import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Film,
  Tv,
  Book,
  BookOpen,
  ExternalLink,
  Clock,
  Loader2,
} from "lucide-react";
import { useAppStore, type TrackedMedia } from "@/store/useAppStore";
import { NFTMiningImageIcon, OpenCookieImageIcon } from "@/components/AppIcons";
import {
  mintCompletion,
  // mapMediaType, // Unused
  mapTrackedType, // Import correct mapping
  readUserNfts,
  getTokensMetadata,
} from "@/services/nft";
import type { CompletionNFT } from "@/types";

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
  default: "from-coral to-violet",
};

export function MintPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isConnected,
    addToast,
    pendingMints,
    removePendingMint,
    currentAccount,
    setCompletions,
    toasts,
  } = useAppStore();
  const [mediaToMint, setMediaToMint] = useState<TrackedMedia | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);

  useEffect(() => {
    // Check for data passed via URL (from extension)
    // Support both HashRouter (useLocation) and standard URL params
    const searchParams = new URLSearchParams(location.search);
    const dataParam = searchParams.get("data");

    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setMediaToMint({
          id: `mint-${Date.now()}`,
          platform: parsedData.platform || "unknown",
          type: parsedData.type || "video",
          title: parsedData.title || "Unknown Media",
          url: parsedData.url || "",
          progress: 100,
          watchTime: parsedData.watchTime || 0,
          thumbnail: parsedData.thumbnail || "",
          completed: true,
          startTime: Date.now(),
          lastUpdate: Date.now(),
        });
        // Clear query param to prevent reload issues
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (e) {
        console.error("Failed to parse mint data from URL", e);
      }
      return;
    }

    if (!isExtension) return;

    chrome.storage?.local?.get(["pendingMint"], (result) => {
      if (!result.pendingMint) return;

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

      chrome.storage.local.remove(["pendingMint"]);
    });
  }, [location.search]);

  useEffect(() => {
    if (pendingMints.length === 0) return;
    if (mediaToMint) return;
    setMediaToMint(pendingMints[0]);
  }, [pendingMints, mediaToMint]);

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
      const hasToast = toasts.some(
        (t) => t.message === "Please connect your wallet first"
      );
      if (!hasToast) {
        addToast({
          type: "error",
          message: "Please connect your wallet first",
        });
      }
      return;
    }

    if (!currentAccount?.address) {
      const hasToast = toasts.some((t) =>
        t.message.includes("Minting requires a wallet address")
      );
      if (!hasToast) {
        addToast({
          type: "error",
          message:
            "Minting requires a wallet address. VeryChat login is social-only. Please connect Wepin.",
        });
      }
      return;
    }

    setIsMinting(true);

    try {
      if (!mediaToMint) {
        throw new Error("Missing media to mint");
      }
      // const kind = mapTrackedType(mediaToMint.type)

      // Create metadata object to store in URI
      const metadata = {
        name: mediaToMint.title,
        description: `Completed on ${new Date().toISOString()}`,
        image: mediaToMint.thumbnail,
        external_url: mediaToMint.url,
        attributes: [
          { trait_type: "Platform", value: mediaToMint.platform },
          { trait_type: "Type", value: mediaToMint.type },
          { trait_type: "Watch Time", value: mediaToMint.watchTime },
          { trait_type: "Completed At", value: new Date().toISOString() },
        ],
      };

      // Create data URI
      const dataUri = `data:application/json;base64,${btoa(
        JSON.stringify(metadata)
      )}`;

      // Call smart contract with data URI as the 'uri' parameter
      const { hash } = await mintCompletion(
        currentAccount.address as `0x${string}`,
        mapTrackedType(mediaToMint.type), // Use correct mapping function
        dataUri, // Pass full metadata URI
        mediaToMint.title
      );
      addToast({ type: "info", message: "Transaction sent" });
      setMintSuccess(true);
      removePendingMint(mediaToMint.id);
      const ids = await readUserNfts(currentAccount.address as `0x${string}`);
      const metas = await getTokensMetadata(ids);
      const items: CompletionNFT[] = metas.map((m) => ({
        id: String(m.tokenId),
        tokenId: String(m.tokenId),
        mediaId: m.mediaId,
        media: {
          id: m.mediaId,
          externalId: m.uri || "",
          title: m.uri || "Achievement",
          type:
            m.kind === 1
              ? "book"
              : m.kind === 2
              ? "movie"
              : m.kind === 3
              ? "anime"
              : m.kind === 4
              ? "comic"
              : m.kind === 5
              ? "manga"
              : "tvshow",
          description: "",
          coverImage: m.tokenURI || "",
          releaseYear: new Date().getFullYear(),
          creator: "",
          genre: [],
          totalCompletions: 0,
        },
        mintedAt: new Date(),
        transactionHash: hash,
        completedAt: new Date(),
        rarity: "common",
      }));
      setCompletions(items);
      addToast({
        type: "success",
        message: "NFT minted successfully! 🎉",
      });
    } catch (error: any) {
      // Log error details for debugging
      console.error("Minting failed:", error);

      // Handle revert errors specifically
      let errorMessage = error.message || "Mint failed";
      if (error.data) {
        // If we have raw error data, it might be a custom error from the contract
        console.error("Error data:", error.data);
      }
      if (errorMessage.includes("execution reverted")) {
        errorMessage =
          "Transaction reverted. You may have already minted this media.";
      }

      addToast({ type: "error", message: errorMessage });
    }

    setIsMinting(false);

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
      <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
        <NFTMiningImageIcon size={96} />
        <h2 className="text-xl font-bold text-white mb-2 mt-4">
          Nothing to Mint
        </h2>
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
    <div className="px-3 py-4 space-y-4 max-w-md mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-2">
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
            className="w-28 h-28 mx-auto mb-6 flex items-center justify-center"
          >
            <OpenCookieImageIcon size={96} />
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
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
              >
                {mediaToMint.thumbnail ? (
                  <img
                    src={mediaToMint.thumbnail}
                    alt={mediaToMint.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Icon className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 leading-tight">
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
                    <span>
                      {["manga", "book", "comic"].includes(mediaToMint.type)
                        ? "Reading time: "
                        : "Watched: "}
                      {formatTime(mediaToMint.watchTime)}
                    </span>
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
                className="mt-4 flex items-center gap-2 text-sm text-coral hover:text-coral-light transition-colors"
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
            <h3 className="text-xs font-medium text-dark-400 mb-2">
              NFT Preview
            </h3>
            <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                <NFTMiningImageIcon size={48} className="mb-2" />
                <p className="text-white font-semibold text-center mb-1 line-clamp-2 px-2 text-xs leading-tight">
                  {mediaToMint.title}
                </p>
                <p className="text-dark-400 text-xs capitalize">
                  {mediaToMint.type} • {mediaToMint.platform}
                </p>
                <div className="mt-2 px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-xs">
                  ✓ Completed
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-coral/50" />
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet/50" />
              <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-violet/50" />
              <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-coral/50" />
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
                       bg-main-gradient 
                       text-white font-semibold text-lg
                       hover:shadow-neon-coral
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
                  <img
                    src="/icons/very-coin.png"
                    alt="Very Coin"
                    className="w-5 h-5"
                  />
                  Mint NFT
                </>
              )}
            </button>

            <button
              onClick={handleLater}
              disabled={isMinting}
              className="w-full py-3 px-4 rounded-xl
                       bg-dark-800 border border-dark-700
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
