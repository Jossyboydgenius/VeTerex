import { motion } from "framer-motion";
import { Award, Calendar, Star, ExternalLink } from "lucide-react";
import type { CompletionNFT } from "@/types";

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  uncommon: "from-green-500 to-emerald-600",
  rare: "from-blue-500 to-indigo-600",
  epic: "from-purple-500 to-violet-600",
  legendary: "from-yellow-500 to-orange-600",
};

const rarityGlow = {
  common: "shadow-gray-500/20",
  uncommon: "shadow-green-500/30",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-yellow-500/50",
};

interface NFTCardProps {
  nft: CompletionNFT;
  onClick?: () => void;
}

export function NFTCard({ nft, onClick }: NFTCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        bg-gradient-to-br ${rarityColors[nft.rarity]} p-[2px]
        shadow-xl ${rarityGlow[nft.rarity]}
      `}
    >
      <div className="bg-dark-900 rounded-2xl overflow-hidden">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {nft.media.coverImage ? (
            <img
              src={nft.media.coverImage}
              alt={nft.media.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
              <Award className="w-12 h-12 text-dark-500" />
            </div>
          )}

          {/* NFT Badge */}
          <div className="absolute top-3 right-3">
            <div
              className={`
              px-2 py-1 rounded-lg text-xs font-bold uppercase
              bg-gradient-to-r ${rarityColors[nft.rarity]} text-white
            `}
            >
              {nft.rarity}
            </div>
          </div>

          {/* Verified Badge */}
          <div className="absolute top-3 left-3">
            <div className="w-8 h-8 rounded-lg bg-dark-900/80 backdrop-blur flex items-center justify-center">
              <Award className="w-4 h-4 text-accent-400" />
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">
            {nft.media.title}
          </h3>

          {/* Completion Date */}
          <div className="flex items-center gap-2 text-xs text-dark-400 mb-3">
            <Calendar className="w-3 h-3" />
            <span>Completed {formatDate(nft.completedAt)}</span>
          </div>

          {/* Rating */}
          {nft.rating && (
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < nft.rating!
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-dark-600"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Token ID */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-500">#{nft.tokenId.slice(0, 8)}</span>
            <button
              className="flex items-center gap-1 text-accent-400 hover:text-accent-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Open transaction in explorer
                window.open(
                  `https://etherscan.io/tx/${nft.transactionHash}`,
                  "_blank"
                );
              }}
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface NFTCardSkeletonProps {
  count?: number;
}

export function NFTCardSkeleton({ count = 1 }: NFTCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-dark-800 animate-pulse"
        >
          <div className="aspect-[3/4] bg-dark-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-dark-700 rounded w-1/2" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="w-4 h-4 bg-dark-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
