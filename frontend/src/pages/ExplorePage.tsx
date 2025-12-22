import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Book,
  Film,
  Tv,
  BookOpen,
  Newspaper,
  Play,
  X,
} from "lucide-react";
import type { MediaItem, MediaType } from "@/types";
import { MediaCard, MediaCardSkeleton } from "@/components/MediaCard";

const mediaTypeFilters = [
  { type: null, icon: null, label: "All" },
  { type: "book", icon: Book, label: "Books" },
  { type: "movie", icon: Film, label: "Movies" },
  { type: "anime", icon: Play, label: "Anime" },
  { type: "manga", icon: BookOpen, label: "Manga" },
  { type: "comic", icon: Newspaper, label: "Comics" },
  { type: "tvshow", icon: Tv, label: "TV" },
];

// Mock data for demonstration
const mockMediaItems: MediaItem[] = [
  {
    id: "1",
    externalId: "tt0111161",
    title: "The Shawshank Redemption",
    type: "movie",
    description: "Two imprisoned men bond over a number of years...",
    coverImage:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop",
    releaseYear: 1994,
    creator: "Frank Darabont",
    genre: ["Drama"],
    totalCompletions: 2453,
  },
  {
    id: "2",
    externalId: "978-0-06-112008-4",
    title: "To Kill a Mockingbird",
    type: "book",
    description:
      "The unforgettable novel of a childhood in a sleepy Southern town...",
    coverImage:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    releaseYear: 1960,
    creator: "Harper Lee",
    genre: ["Classic", "Fiction"],
    totalCompletions: 1892,
  },
  {
    id: "3",
    externalId: "21",
    title: "Death Note",
    type: "anime",
    description: "A high school student discovers a supernatural notebook...",
    coverImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop",
    releaseYear: 2006,
    creator: "Madhouse",
    genre: ["Thriller", "Supernatural"],
    totalCompletions: 3241,
  },
  {
    id: "4",
    externalId: "tt0903747",
    title: "Breaking Bad",
    type: "tvshow",
    description:
      "A high school chemistry teacher turned methamphetamine manufacturer...",
    coverImage:
      "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop",
    releaseYear: 2008,
    creator: "Vince Gilligan",
    genre: ["Drama", "Crime"],
    totalCompletions: 4521,
  },
  {
    id: "5",
    externalId: "13",
    title: "One Piece",
    type: "manga",
    description: "Follows the adventures of Monkey D. Luffy and his crew...",
    coverImage:
      "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300&h=400&fit=crop",
    releaseYear: 1997,
    creator: "Eiichiro Oda",
    genre: ["Adventure", "Action"],
    totalCompletions: 5123,
  },
  {
    id: "6",
    externalId: "tt0816692",
    title: "Interstellar",
    type: "movie",
    description: "A team of explorers travel through a wormhole in space...",
    coverImage:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&h=400&fit=crop",
    releaseYear: 2014,
    creator: "Christopher Nolan",
    genre: ["Sci-Fi", "Drama"],
    totalCompletions: 3892,
  },
  {
    id: "7",
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
  {
    id: "8",
    externalId: "1535",
    title: "Attack on Titan",
    type: "anime",
    description: "Humanity lives inside cities surrounded by enormous walls...",
    coverImage:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&h=400&fit=crop",
    releaseYear: 2013,
    creator: "Wit Studio",
    genre: ["Action", "Dark Fantasy"],
    totalCompletions: 4156,
  },
];

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedType, setSelectedType] = useState<MediaType | null>(
    (searchParams.get("type") as MediaType) || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = mockMediaItems;

      if (selectedType) {
        filtered = filtered.filter((item) => item.type === selectedType);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.creator.toLowerCase().includes(query)
        );
      }

      setMediaItems(filtered);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedType, searchQuery]);

  const handleTypeChange = (type: MediaType | null) => {
    setSelectedType(type);
    if (type) {
      searchParams.set("type", type);
    } else {
      searchParams.delete("type");
    }
    setSearchParams(searchParams);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      searchParams.set("search", query);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for books, movies, anime..."
          className="input-field-search"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dark-700"
          >
            <X className="w-4 h-4 text-dark-400" />
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {mediaTypeFilters.map(({ type, icon: Icon, label }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTypeChange(type as MediaType | null)}
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
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {selectedType
              ? `${
                  selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
                }s`
              : "All Media"}
          </h2>
          <p className="text-sm text-dark-400">
            {isLoading ? "..." : `${mediaItems.length} results`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            <MediaCardSkeleton count={6} />
          ) : mediaItems.length > 0 ? (
            mediaItems.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MediaCard
                  media={media}
                  onClick={() => navigate(`/media/${media.id}`)}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <Search className="w-12 h-12 mx-auto text-dark-600 mb-4" />
              <p className="text-dark-400">No results found</p>
              <p className="text-sm text-dark-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
