import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  UserCheck,
  MessageCircle,
  Award,
  Sparkles,
  ChevronRight,
  Share2,
  X,
  Link,
  Check,
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
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    commonNFTs: 5,
  },
];

export function CommunityPage() {
  const { isConnected, addToast } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"groups" | "matches">("groups");
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleFriend = (userId: string) => {
    const wasAdded = addedFriends.has(userId);
    setAddedFriends((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
    // Show toast after state update
    if (wasAdded) {
      addToast({ type: "info", message: "Friend removed" });
    } else {
      addToast({ type: "success", message: "Friend added!" });
    }
  };

  const openShareModal = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setShowShareModal(true);
    setCopied(false);
  };

  const copyShareLink = () => {
    if (selectedGroup) {
      const link = `${window.location.origin}/#/community/group/${selectedGroup.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      addToast({ type: "success", message: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet/20 to-coral/20 flex items-center justify-center border border-violet/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(99, 102, 241, 0.2)",
                "0 0 40px rgba(99, 102, 241, 0.4)",
                "0 0 20px rgba(99, 102, 241, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Users className="w-12 h-12 text-violet" />
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
            <div className="w-12 h-12 rounded-full bg-coral/20 border-2 border-dark-900 flex items-center justify-center">
              <span className="text-xs text-coral font-bold">+99</span>
            </div>
          </div>

          <p className="text-sm text-dark-500">
            <span className="text-violet font-semibold">3,200+</span> active
            members
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
                ? "bg-coral text-white"
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
                ? "bg-coral text-white"
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

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => openShareModal(group, e)}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
                <ChevronRight className="w-5 h-5 text-dark-500" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Matches Info */}
          <div className="card bg-gradient-to-br from-coral/10 to-violet/10 border-coral/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-coral" />
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
                    <div className="flex items-center gap-1 text-sm text-coral">
                      <Award className="w-3 h-3" />
                      <span>{user.commonNFTs} matching NFTs</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFriend(user.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      addedFriends.has(user.id)
                        ? "bg-brand-green/20 text-brand-green"
                        : "bg-coral/20 text-coral hover:bg-coral/30"
                    }`}
                  >
                    {addedFriends.has(user.id) ? (
                      <UserCheck className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedGroup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
              >
                <div className="bg-dark-900 rounded-2xl border border-dark-700 p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Share Group
                    </h3>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-dark-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 mb-4">
                    {selectedGroup.media.coverImage && (
                      <img
                        src={selectedGroup.media.coverImage}
                        alt={selectedGroup.media.title}
                        className="w-12 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-white">
                        {selectedGroup.media.title}
                      </h4>
                      <p className="text-sm text-dark-400">
                        {selectedGroup.memberCount.toLocaleString()} members
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={copyShareLink}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-brand-green" />
                      ) : (
                        <Link className="w-5 h-5 text-dark-400" />
                      )}
                      <span className="text-white">
                        {copied ? "Link Copied!" : "Copy Link"}
                      </span>
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          window.open(
                            `https://twitter.com/intent/tweet?text=Join%20me%20in%20the%20${encodeURIComponent(
                              selectedGroup.media.title
                            )}%20group%20on%20VeTerex!&url=${encodeURIComponent(
                              `${window.location.origin}/#/community/group/${selectedGroup.id}`
                            )}`,
                            "_blank"
                          );
                        }}
                        className="flex-1 p-3 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] transition-colors text-sm font-medium"
                      >
                        Twitter
                      </button>
                      <button
                        onClick={() => {
                          window.open(
                            `https://t.me/share/url?url=${encodeURIComponent(
                              `${window.location.origin}/#/community/group/${selectedGroup.id}`
                            )}&text=Join%20me%20in%20the%20${encodeURIComponent(
                              selectedGroup.media.title
                            )}%20group%20on%20VeTerex!`,
                            "_blank"
                          );
                        }}
                        className="flex-1 p-3 rounded-xl bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] transition-colors text-sm font-medium"
                      >
                        Telegram
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
