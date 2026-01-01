import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Calendar, Loader2, Sparkles } from "lucide-react";
import type { MediaItem } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { mintCompletion, mapTrackedType } from "@/services/nft";
import {
  NFTMiningImageIcon,
  OpenCookieImageIcon,
  VeryCoinImageIcon,
} from "./AppIcons";

interface MintNFTModalProps {
  media: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MintNFTModal({
  media,
  isOpen,
  onClose,
  onSuccess,
}: MintNFTModalProps) {
  const { currentAccount, addToast, addCompletion } = useAppStore();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [completedDate, setCompletedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleMint = async () => {
    if (!currentAccount) {
      addToast({ type: "error", message: "Please connect your wallet first" });
      return;
    }

    if (!currentAccount.address) {
      addToast({
        type: "error",
        message: "Minting requires a wallet address. Please connect Wepin.",
      });
      return;
    }

    setIsMinting(true);
    try {
      // Create metadata object to store in URI
      const metadata = {
        name: media.title,
        description: `Completed on ${new Date(completedDate).toISOString()}`,
        image: media.coverImage || "",
        external_url: "",
        attributes: [
          { trait_type: "Type", value: media.type },
          { trait_type: "Rating", value: rating > 0 ? rating : "Not rated" },
          {
            trait_type: "Completed At",
            value: new Date(completedDate).toISOString(),
          },
        ],
      };

      // Create data URI
      const dataUri = `data:application/json;base64,${btoa(
        JSON.stringify(metadata)
      )}`;

      // Call smart contract directly
      const { hash } = await mintCompletion(
        currentAccount.address as `0x${string}`,
        mapTrackedType(media.type),
        dataUri,
        media.title
      );

      // Add to local state
      addCompletion({
        id: `nft-${Date.now()}`,
        tokenId: `nft-${Date.now()}`,
        mediaId: media.id,
        media: media,
        mintedAt: new Date(),
        transactionHash: hash,
        completedAt: new Date(completedDate),
        rating: rating > 0 ? rating : undefined,
        review: review.trim() || undefined,
        rarity: "common",
      });

      setIsSuccess(true);
      addToast({ type: "success", message: "NFT minted successfully! 🎉" });

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Mint error:", error);
      addToast({
        type: "error",
        message: "Failed to mint NFT. Please try again.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md max-h-[calc(100vh-120px)]"
            >
              <div className="glass-dark rounded-2xl border border-dark-700 overflow-hidden max-h-[calc(100vh-140px)] overflow-y-auto">
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-dark-700">
                  <button
                    onClick={onClose}
                    disabled={isMinting}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-dark-400" />
                  </button>

                  <div className="flex items-center gap-3">
                    <NFTMiningImageIcon size={48} />
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Mint Completion NFT
                      </h2>
                      <p className="text-sm text-dark-400">
                        Create permanent proof of your achievement
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                {isSuccess ? (
                  <div className="p-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 mx-auto mb-4 flex items-center justify-center"
                    >
                      <OpenCookieImageIcon size={92} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      NFT Minted!
                    </h3>
                    <p className="text-dark-400">
                      Your achievement has been recorded on the blockchain.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {/* Media Preview */}
                    <div className="flex gap-4 p-4 rounded-xl bg-dark-800/50">
                      {media.coverImage ? (
                        <img
                          src={media.coverImage}
                          alt={media.title}
                          className="w-16 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-24 rounded-lg bg-dark-700 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-dark-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white line-clamp-2">
                          {media.title}
                        </h3>
                        <p className="text-sm text-dark-400 mt-1">
                          {media.creator}
                        </p>
                        <p className="text-xs text-dark-500 mt-1 capitalize">
                          {media.type}
                        </p>
                      </div>
                    </div>

                    {/* Completion Date */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white" />
                          <span>Completion Date</span>
                        </div>
                      </label>
                      <input
                        type="date"
                        value={completedDate}
                        onChange={(e) => setCompletedDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="input-field"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-dark-300" />
                          <span>Your Rating (optional)</span>
                        </div>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() =>
                              setRating(rating === value ? 0 : value)
                            }
                            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                value <= rating
                                  ? "text-brand-yellow fill-brand-yellow"
                                  : "text-dark-600 hover:text-dark-500"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Short Review (optional)
                      </label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={3}
                        maxLength={280}
                        className="input-field resize-none"
                      />
                      <p className="text-xs text-dark-500 mt-1 text-right">
                        {review.length}/280
                      </p>
                    </div>

                    {/* Mint Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Minting...</span>
                        </>
                      ) : (
                        <>
                          <VeryCoinImageIcon size={20} />
                          <span>Mint NFT</span>
                        </>
                      )}
                    </motion.button>

                    <p className="text-xs text-dark-500 text-center">
                      This will create a soulbound (non-transferable) NFT on the
                      blockchain.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
