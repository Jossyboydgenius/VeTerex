import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Library,
  Grid3X3,
  List,
  Award,
  Book,
  Film,
  Tv,
  Play,
  BookOpen,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { NFTCard } from "@/components/NFTCard";
import type { MediaType, CompletionNFT } from "@/types";
import { readUserNfts, getTokensMetadata } from "@/services/nft";

// Helper to extract YouTube video ID
function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to generate thumbnail URL
function getThumbnail(url: string, _type: string) {
  if (!url) return "";
  
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = getYoutubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  
  // Webtoons (try to find image in URL or return generic cover based on type)
  // Since we can't scrape, we might return a type-specific placeholder if real image not found
  // But for now, if it's the test data, we know the thumbnail is not in the URL
  // The smart contract 'uri' is the content link, not image. 
  // We don't have the image stored on-chain.
  
  return ""; 
}

// Helper to format title from URL
function formatTitle(url: string) {
  if (!url) return "Achievement";
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    if (hostname.includes('youtube')) return 'YouTube Video';
    if (hostname.includes('webtoons')) return 'Webtoon Chapter';
    if (hostname.includes('netflix')) return 'Netflix Show';
    
    return `${hostname} Content`;
  } catch {
    return url.length > 30 ? url.substring(0, 27) + '...' : url;
  }
}

const typeFilters = [
  { type: null, label: "All", icon: Library },
  { type: "book", label: "Books", icon: Book },
  { type: "movie", label: "Movies", icon: Film },
  { type: "anime", label: "Anime", icon: Play },
  { type: "manga", label: "Manga", icon: BookOpen },
  { type: "tvshow", label: "TV", icon: Tv },
];

export function CollectionPage() {
  const { isConnected, completions, setCompletions, currentAccount, addToast } = useAppStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<MediaType | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!isConnected || !currentAccount?.address) return
        const ids = await readUserNfts(currentAccount.address as `0x${string}`)
        const metas = await getTokensMetadata(ids)
        const items: CompletionNFT[] = metas.map((m) => {
        // Try to parse metadata from data URI if present
        let externalId = m.uri || "";
        let title = m.uri ? formatTitle(m.uri) : "Achievement";
        let coverImage = (m.uri ? getThumbnail(m.uri, "") : "") || m.tokenURI || "";
        let description = m.uri || "";

        if (m.uri && m.uri.startsWith("data:application/json")) {
          try {
            // Extract base64 part
            const base64 = m.uri.split(",")[1];
            if (base64) {
              const json = JSON.parse(atob(base64));
              if (json.name) title = json.name;
              if (json.image) coverImage = json.image;
              if (json.external_url) externalId = json.external_url;
              if (json.description) description = json.description;
            }
          } catch (e) {
            console.warn("Failed to parse metadata URI", e);
          }
        }

        // Preserve existing completion info (e.g., transaction hash) by tokenId
        const existing = completions.find((c) => c.tokenId === String(m.tokenId));

        return {
          id: String(m.tokenId),
          tokenId: String(m.tokenId),
          mediaId: m.mediaId,
          media: {
            id: m.mediaId,
            externalId,
            title,
            type: m.kind === 1 ? "book" : m.kind === 2 ? "movie" : m.kind === 3 ? "anime" : m.kind === 4 ? "comic" : m.kind === 5 ? "manga" : "tvshow",
            description,
            coverImage,
            releaseYear: new Date().getFullYear(),
            creator: "",
            genre: [],
            totalCompletions: 0,
          },
          mintedAt: existing?.mintedAt || new Date(),
          transactionHash: existing?.transactionHash || "",
          completedAt: new Date(),
          rarity: ["common", "rare", "epic", "legendary"][Number(m.tokenId) % 4] as any,
        };
      })
        setCompletions(items)
      } catch (e: any) {
        console.error("Failed to load collection:", e)
        addToast({
          type: "error",
          message: e?.message ? `Failed to load collection: ${e.message}` : "Failed to load collection",
        })
      }
    }
    load()
  }, [isConnected, currentAccount?.address, setCompletions, completions, addToast])

  const displayNFTs = isConnected ? completions : [];

  const filteredNFTs = selectedType
    ? displayNFTs.filter((nft) => nft.media.type === selectedType)
    : displayNFTs;

          // Stats
  const totalNFTs = displayNFTs.length;
  const typeStats = displayNFTs.reduce((acc, nft) => {
    acc[nft.media.type] = (acc[nft.media.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isConnected) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-coral/20 to-violet/20 flex items-center justify-center border border-coral/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.2)",
                "0 0 40px rgba(168, 85, 247, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Library className="w-12 h-12 text-coral" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-3">
            Your Collection
          </h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-8">
            Connect your wallet to view and manage your achievement NFTs. Track
            every book, movie, and anime you've completed.
          </p>

          {/* Preview Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&h=200&fit=crop",
              "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&h=200&fit=crop",
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&h=200&fit=crop",
            ].map((img, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-dark-800/50 border border-dark-700 overflow-hidden opacity-60 hover:opacity-80 transition-opacity"
              >
                <img
                  src={img}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <p className="text-sm text-dark-500">
            <span className="text-coral font-semibold">12,450+</span> NFTs
            minted by users
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Collection</h1>
          <p className="text-sm text-dark-400">{totalNFTs} achievement NFTs</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 bg-dark-800 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-coral text-white"
                : "text-dark-400 hover:text-white"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-coral text-white"
                : "text-dark-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(typeStats)
          .slice(0, 3)
          .map(([type, count]) => {
            const filterData = typeFilters.find((f) => f.type === type);
            const Icon = filterData?.icon || Award;

            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.02 }}
                className="card text-center py-3 cursor-pointer"
                onClick={() =>
                  setSelectedType(
                    selectedType === type ? null : (type as MediaType)
                  )
                }
              >
                <Icon className="w-5 h-5 mx-auto text-coral mb-1" />
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-dark-400 capitalize">{type}s</p>
              </motion.div>
            );
          })}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {typeFilters.map(({ type, label, icon: Icon }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType(type as MediaType | null)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${
                selectedType === type
                  ? "bg-coral text-white"
                  : "bg-dark-800 text-dark-300 hover:bg-dark-700"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr"
              : "space-y-4"
          }
        >
          {filteredNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full"
            >
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img src="/icons/cloud.svg" alt="Cloud" className="w-20 h-20" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No NFTs Found</h3>
          <p className="text-dark-400 max-w-xs">
            {selectedType
              ? `You haven't earned any ${selectedType} NFTs yet.`
              : "Start tracking media to earn your first NFT!"}
          </p>
        </div>
      )}
    </div>
  );
}
