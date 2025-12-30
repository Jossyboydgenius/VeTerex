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
  {
    id: "4",
    tokenId: "0x4567890123def012",
    mediaId: "4",
    media: {
      id: "4",
      externalId: "tt0903747",
      title: "Breaking Bad",
      type: "tvshow",
      description: "A chemistry teacher turned methamphetamine manufacturer...",
      coverImage:
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop",
      releaseYear: 2008,
      creator: "Vince Gilligan",
      genre: ["Drama", "Crime"],
      totalCompletions: 4521,
    },
    mintedAt: new Date("2024-01-25"),
    transactionHash: "0xjkl012...",
    completedAt: new Date("2024-01-20"),
    rating: 5,
    review: "Best TV show ever made.",
    rarity: "epic",
  },
  {
    id: "5",
    tokenId: "0x5678901234ef0123",
    mediaId: "5",
    media: {
      id: "5",
      externalId: "13",
      title: "One Piece",
      type: "manga",
      description: "Follows the adventures of Monkey D. Luffy...",
      coverImage:
        "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300&h=400&fit=crop",
      releaseYear: 1997,
      creator: "Eiichiro Oda",
      genre: ["Adventure", "Action"],
      totalCompletions: 5123,
    },
    mintedAt: new Date("2024-02-10"),
    transactionHash: "0xmno345...",
    completedAt: new Date("2024-02-05"),
    rating: 5,
    rarity: "legendary",
  },
  {
    id: "6",
    tokenId: "0x6789012345f01234",
    mediaId: "6",
    media: {
      id: "6",
      externalId: "tt0816692",
      title: "Interstellar",
      type: "movie",
      description: "A team of explorers travel through a wormhole...",
      coverImage:
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=400&fit=crop",
      releaseYear: 2014,
      creator: "Christopher Nolan",
      genre: ["Sci-Fi", "Drama"],
      totalCompletions: 3892,
    },
    mintedAt: new Date("2024-03-15"),
    transactionHash: "0xpqr678...",
    completedAt: new Date("2024-03-10"),
    rating: 5,
    review: "Mind-bending and emotional.",
    rarity: "rare",
  },
  {
    id: "7",
    tokenId: "0x7890123456012345",
    mediaId: "7",
    media: {
      id: "7",
      externalId: "1535",
      title: "Attack on Titan",
      type: "anime",
      description:
        "Humanity lives inside cities surrounded by enormous walls...",
      coverImage:
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&h=400&fit=crop",
      releaseYear: 2013,
      creator: "Wit Studio",
      genre: ["Action", "Dark Fantasy"],
      totalCompletions: 4156,
    },
    mintedAt: new Date("2024-02-28"),
    transactionHash: "0xstu901...",
    completedAt: new Date("2024-02-25"),
    rating: 5,
    rarity: "epic",
  },
  {
    id: "8",
    tokenId: "0x8901234567123456",
    mediaId: "8",
    media: {
      id: "8",
      externalId: "978-0-7432-7356-5",
      title: "1984",
      type: "book",
      description: "A dystopian social science fiction novel...",
      coverImage:
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
      releaseYear: 1949,
      creator: "George Orwell",
      genre: ["Dystopian", "Political"],
      totalCompletions: 2789,
    },
    mintedAt: new Date("2024-03-20"),
    transactionHash: "0xvwx234...",
    completedAt: new Date("2024-03-18"),
    rating: 4,
    review: "Eerily relevant today.",
    rarity: "rare",
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
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center border border-accent-500/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.2)",
                "0 0 40px rgba(168, 85, 247, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Library className="w-12 h-12 text-accent-400" />
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
            <span className="text-accent-400 font-semibold">12,450+</span> NFTs
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
