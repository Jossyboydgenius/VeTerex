import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  MessageCircle,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Group } from "@/types";

// Mock groups data
const mockGroups: Group[] = [
  {
    id: "1",
    mediaId: "1",
    media: {
      id: "1",
      externalId: "tt0111161",
      title: "The Shawshank Redemption",
      type: "movie",
      description: "Two imprisoned men...",
      coverImage:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop",
      releaseYear: 1994,
      creator: "Frank Darabont",
      genre: ["Drama"],
      totalCompletions: 2453,
    },
    members: [],
    memberCount: 892,
    createdAt: new Date("2023-01-15"),
    recentActivity: [],
  },
  {
    id: "2",
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
    members: [],
    memberCount: 1456,
    createdAt: new Date("2023-03-20"),
    recentActivity: [],
  },
  {
    id: "3",
    mediaId: "4",
    media: {
      id: "4",
      externalId: "tt0903747",
      title: "Breaking Bad",
      type: "tvshow",
      description: "A chemistry teacher...",
      coverImage:
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop",
      releaseYear: 2008,
      creator: "Vince Gilligan",
      genre: ["Drama"],
      totalCompletions: 4521,
    },
    members: [],
    memberCount: 2103,
    createdAt: new Date("2023-02-10"),
    recentActivity: [],
  },
];

// Mock users with matching NFTs
const mockMatchingUsers = [
  {
    id: "1",
    username: "MediaMaster",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    commonNFTs: 3,
  },
  {
    id: "2",
    username: "AnimeEnthusiast",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    commonNFTs: 2,
  },
  {
    id: "3",
    username: "BookWorm99",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
    commonNFTs: 5,
  },
];

export function CommunityPage() {
  const { isConnected } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"groups" | "matches">("groups");

  if (!isConnected) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(99, 102, 241, 0.2)",
                "0 0 40px rgba(99, 102, 241, 0.4)",
                "0 0 20px rgba(99, 102, 241, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Users className="w-12 h-12 text-primary-400" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-3">Community</h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-8">
            Connect your wallet to discover others who share your media
            achievements and join discussion groups.
          </p>

          {/* Preview Users */}
          <div className="flex justify-center -space-x-3 mb-6">
            {[
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
            ].map((img, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-2 border-dark-900 overflow-hidden"
                style={{ opacity: 1 - i * 0.1 }}
              >
                <img
                  src={img}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full bg-accent-500/20 border-2 border-dark-900 flex items-center justify-center">
              <span className="text-xs text-accent-400 font-bold">+99</span>
            </div>
          </div>

          <p className="text-sm text-dark-500">
            <span className="text-primary-400 font-semibold">3,200+</span>{" "}
            active members
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Community</h1>
        <p className="text-sm text-dark-400">Connect with fellow completers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-800 rounded-xl">
        <button
          onClick={() => setActiveTab("groups")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              activeTab === "groups"
                ? "bg-accent-500 text-white"
                : "text-dark-400 hover:text-white"
            }
          `}
        >
          <Users className="w-4 h-4" />
          <span>Groups</span>
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              activeTab === "matches"
                ? "bg-accent-500 text-white"
                : "text-dark-400 hover:text-white"
            }
          `}
        >
          <Sparkles className="w-4 h-4" />
          <span>Matches</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "groups" ? (
        <div className="space-y-4">
          {/* Your Groups Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Media Groups</h2>
            <span className="text-sm text-dark-400">
              {mockGroups.length} groups available
            </span>
          </div>

          {/* Groups List */}
          {mockGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate(`/community/group/${group.id}`)}
              className="card flex items-center gap-4 cursor-pointer"
            >
              {/* Media Cover */}
              <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {group.media.coverImage ? (
                  <img
                    src={group.media.coverImage}
                    alt={group.media.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                    <Award className="w-6 h-6 text-dark-500" />
                  </div>
                )}
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {group.media.title}
                </h3>
                <p className="text-sm text-dark-400 capitalize">
                  {group.media.type}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-dark-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{group.memberCount.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-dark-500" />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Matches Info */}
          <div className="card bg-gradient-to-br from-accent-500/10 to-primary-500/10 border-accent-500/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">NFT Matching</h3>
                <p className="text-sm text-dark-400">
                  Users with matching achievement NFTs are automatically visible
                  to each other. Connect with people who share your media
                  journey!
                </p>
              </div>
            </div>
          </div>

          {/* Matching Users */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              People Like You
            </h2>

            <div className="space-y-3">
              {mockMatchingUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="card flex items-center gap-4 cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-accent-400">
                      <Award className="w-3 h-3" />
                      <span>{user.commonNFTs} matching NFTs</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30"
                  >
                    <UserPlus className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
