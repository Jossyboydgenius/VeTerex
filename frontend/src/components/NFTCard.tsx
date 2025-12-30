import { motion } from "framer-motion";
import { Calendar, Star, ExternalLink } from "lucide-react";
import type { CompletionNFT } from "@/types";
import { CrownIcon, StarIcon } from "./AppIcons";

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
        shadow-xl ${rarityGlow[nft.rarity]} h-full
      `}
    >
      <div className="bg-dark-900 rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Cover Image - Reduced aspect ratio from 3/4 to 4/5 */}
        <div className="relative aspect-[4/5] overflow-hidden flex-shrink-0">
          {nft.media.coverImage ? (
            <img
              src={nft.media.coverImage}
              alt={nft.media.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
              <StarIcon isActive={true} size={40} />
            </div>
          )}

          {/* NFT Badge */}
          <div className="absolute top-2 right-2">
            <div
              className={`
              px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase
              bg-gradient-to-r ${rarityColors[nft.rarity]} text-white
            `}
            >
              {nft.rarity}
            </div>
          </div>

          {/* Verified Badge */}
          <div className="absolute top-2 left-2">
            <CrownIcon isActive={true} size={20} />
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
        </div>

        {/* Info - More compact */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Title with ellipsis - single line */}
          <h3
            className="font-semibold text-white text-sm truncate mb-1.5"
            title={nft.media.title}
          >
            {nft.media.title}
          </h3>

          {/* Completion Date */}
          <div className="flex items-center gap-1.5 text-[10px] text-dark-400 mb-2">
            <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">
              Completed {formatDate(nft.completedAt)}
            </span>
          </div>

          {/* Rating - Smaller stars */}
          {nft.rating && (
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < nft.rating!
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-dark-600"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Token ID - Push to bottom */}
          <div className="flex items-center justify-between text-[10px] mt-auto">
            <span className="text-dark-500 truncate">
              #{nft.tokenId.slice(0, 8)}
            </span>
            <button
              className="flex items-center gap-0.5 text-coral hover:text-coral-light transition-colors flex-shrink-0"
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
              <ExternalLink className="w-2.5 h-2.5" />
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
          className="rounded-2xl overflow-hidden bg-dark-800 animate-pulse h-full"
        >
          <div className="aspect-[4/5] bg-dark-700" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-2.5 bg-dark-700 rounded w-1/2" />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="w-3 h-3 bg-dark-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
