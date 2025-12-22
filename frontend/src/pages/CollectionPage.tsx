import { useState } from "react";
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

// Mock NFT data
const mockNFTs: CompletionNFT[] = [
  {
    id: "1",
    tokenId: "0x1234567890abcdef",
    mediaId: "1",
    media: {
      id: "1",
      externalId: "tt0111161",
      title: "The Shawshank Redemption",
      type: "movie",
      description: "Two imprisoned men bond over years...",
      coverImage:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop",
      releaseYear: 1994,
      creator: "Frank Darabont",
      genre: ["Drama"],
      totalCompletions: 2453,
    },
    mintedAt: new Date("2024-01-15"),
    transactionHash: "0xabc123...",
    completedAt: new Date("2024-01-10"),
    rating: 5,
    review: "An absolute masterpiece.",
    rarity: "rare",
  },
  {
    id: "2",
    tokenId: "0x2345678901bcdef0",
    mediaId: "3",
    media: {
      id: "3",
      externalId: "21",
      title: "Death Note",
      type: "anime",
      description: "A supernatural notebook...",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop",
      releaseYear: 2006,
      creator: "Madhouse",
      genre: ["Thriller"],
      totalCompletions: 3241,
    },
    mintedAt: new Date("2024-02-20"),
    transactionHash: "0xdef456...",
    completedAt: new Date("2024-02-18"),
    rating: 4,
    rarity: "epic",
  },
  {
    id: "3",
    tokenId: "0x3456789012cdef01",
    mediaId: "2",
    media: {
      id: "2",
      externalId: "978-0-06-112008-4",
      title: "To Kill a Mockingbird",
      type: "book",
      description: "A classic novel...",
      coverImage:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
      releaseYear: 1960,
      creator: "Harper Lee",
      genre: ["Classic"],
      totalCompletions: 1892,
    },
    mintedAt: new Date("2024-03-05"),
    transactionHash: "0xghi789...",
    completedAt: new Date("2024-03-01"),
    rating: 5,
    review: "Changed my perspective.",
    rarity: "legendary",
  },
];

const typeFilters = [
  { type: null, label: "All", icon: Library },
  { type: "book", label: "Books", icon: Book },
  { type: "movie", label: "Movies", icon: Film },
  { type: "anime", label: "Anime", icon: Play },
  { type: "manga", label: "Manga", icon: BookOpen },
  { type: "tvshow", label: "TV", icon: Tv },
];

export function CollectionPage() {
  const { isConnected, completions } = useAppStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<MediaType | null>(null);

  // Use mock data for demo, real app would use `completions` from store
  const displayNFTs = isConnected
    ? completions.length > 0
      ? completions
      : mockNFTs
    : [];

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
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-800 flex items-center justify-center">
            <Library className="w-10 h-10 text-dark-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Your Collection
          </h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-6">
            Connect your wallet to view your achievement NFTs
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
                ? "bg-accent-500 text-white"
                : "text-dark-400 hover:text-white"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-accent-500 text-white"
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
                <Icon className="w-5 h-5 mx-auto text-accent-400 mb-1" />
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
                  ? "bg-accent-500 text-white"
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
            viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"
          }
        >
          {filteredNFTs.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NFTCard nft={nft} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="w-12 h-12 mx-auto text-dark-600 mb-4" />
          <p className="text-dark-400">No NFTs in this category</p>
          <p className="text-sm text-dark-500 mt-1">
            Complete more {selectedType}s to earn NFTs!
          </p>
        </div>
      )}
    </div>
  );
}
