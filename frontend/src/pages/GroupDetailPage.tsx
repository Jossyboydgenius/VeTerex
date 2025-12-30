import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Award,
  Calendar,
  Heart,
  Share2,
  Send,
  MoreHorizontal,
  X,
  Link,
  Check,
  Flag,
  Bell,
  BellOff,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Group } from "@/types";

// Mock groups data (same as in CommunityPage)
const mockGroups: Group[] = [
  {
    id: "1",
    mediaId: "1",
    media: {
      id: "1",
      externalId: "tt0111161",
      title: "The Shawshank Redemption",
      type: "movie",
      description:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
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
      description:
        "A high school student discovers a supernatural notebook that allows him to kill anyone by writing their name in it.",
      coverImage:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=400&fit=crop",
      releaseYear: 2006,
      creator: "Madhouse",
      genre: ["Thriller", "Supernatural"],
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
      description:
        "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine.",
      coverImage:
        "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop",
      releaseYear: 2008,
      creator: "Vince Gilligan",
      genre: ["Drama", "Crime"],
      totalCompletions: 4521,
    },
    members: [],
    memberCount: 2103,
    createdAt: new Date("2023-02-10"),
    recentActivity: [],
  },
];

// Mock discussion posts
const mockPosts = [
  {
    id: "1",
    user: {
      name: "MovieBuff42",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    },
    content:
      "Just rewatched this for the 5th time. The ending still gives me chills every time!",
    likes: 24,
    replies: 8,
    createdAt: new Date("2024-03-20T14:30:00"),
  },
  {
    id: "2",
    user: {
      name: "CinemaLover",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    content:
      "The character development in this is unmatched. Every detail matters.",
    likes: 18,
    replies: 5,
    createdAt: new Date("2024-03-19T10:15:00"),
  },
  {
    id: "3",
    user: {
      name: "StorytellerPro",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    content:
      "Who else thinks this deserves more recognition? Let's discuss the themes!",
    likes: 31,
    replies: 12,
    createdAt: new Date("2024-03-18T16:45:00"),
  },
];

// Mock members
const mockMembers = [
  {
    id: "1",
    name: "MovieBuff42",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    nfts: 12,
    joinedAt: new Date("2023-02-15"),
  },
  {
    id: "2",
    name: "CinemaLover",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    nfts: 8,
    joinedAt: new Date("2023-03-20"),
  },
  {
    id: "3",
    name: "StorytellerPro",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    nfts: 15,
    joinedAt: new Date("2023-01-10"),
  },
  {
    id: "4",
    name: "MediaEnthusiast",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    nfts: 6,
    joinedAt: new Date("2023-04-05"),
  },
];

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<"discussion" | "members">(
    "discussion"
  );
  const [newPost, setNewPost] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [shareContent, setShareContent] = useState<{
    type: "group" | "post";
    postContent?: string;
  } | null>(null);

  const copyShareLink = () => {
    if (group) {
      const link = `${window.location.origin}/#/community/group/${group.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      addToast({ type: "success", message: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sharePost = (postContent: string) => {
    setShareContent({ type: "post", postContent });
    setShowShareModal(true);
    setCopied(false);
  };

  const openGroupShareModal = () => {
    setShareContent({ type: "group" });
    setShowShareModal(true);
    setCopied(false);
  };

  useEffect(() => {
    // Find the group by ID
    const foundGroup = mockGroups.find((g) => g.id === id);
    setGroup(foundGroup || null);
  }, [id]);

  if (!group) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <p className="text-dark-400">Group not found</p>
        <button
          onClick={() => navigate("/community")}
          className="mt-4 btn-primary"
        >
          Back to Community
        </button>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    // In real app, this would send to backend
    console.log("Posting:", newPost);
    setNewPost("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 glass-dark border-b border-dark-700/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/community")}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">
              {group.media.title}
            </h1>
            <p className="text-xs text-dark-400 capitalize">
              {group.media.type} Group
            </p>
          </div>
          <button
            onClick={openGroupShareModal}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <Share2 className="w-5 h-5 text-dark-400" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-dark-400" />
            </button>

            {/* More Menu Dropdown */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setNotifications(!notifications);
                      addToast({
                        type: "success",
                        message: notifications
                          ? "Notifications disabled"
                          : "Notifications enabled",
                      });
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                  >
                    {notifications ? (
                      <BellOff className="w-4 h-4 text-dark-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-dark-400" />
                    )}
                    <span className="text-sm">
                      {notifications
                        ? "Mute notifications"
                        : "Enable notifications"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      openGroupShareModal();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-dark-400" />
                    <span className="text-sm">Share group</span>
                  </button>
                  <button
                    onClick={() => {
                      addToast({ type: "info", message: "Report submitted" });
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-coral hover:bg-dark-700 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-sm">Report group</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Group Banner */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={group.media.coverImage}
            alt={group.media.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
        </div>

        {/* Group Info */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-28 rounded-xl overflow-hidden border-4 border-dark-900 shadow-lg">
              <img
                src={group.media.coverImage}
                alt={group.media.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold text-white">
                {group.media.title}
              </h2>
              <p className="text-sm text-dark-400">
                {group.media.creator} • {group.media.releaseYear}
              </p>
            </div>
          </div>

          {/* Stats and Join Button */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Users className="w-4 h-4" />
              <span>{group.memberCount.toLocaleString()} members</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <MessageCircle className="w-4 h-4" />
              <span>{mockPosts.length} posts</span>
            </div>
            <div className="flex-1" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsJoined(!isJoined)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isJoined
                  ? "bg-dark-700 text-dark-300 border border-dark-700"
                  : "bg-coral text-white"
              }`}
            >
              {isJoined ? "Joined" : "Join Group"}
            </motion.button>
          </div>

          {/* Description */}
          <p className="text-sm text-dark-400 mb-6">
            {group.media.description}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-dark-800 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("discussion")}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  activeTab === "discussion"
                    ? "bg-coral text-white"
                    : "text-dark-400 hover:text-white"
                }
              `}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discussion</span>
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  activeTab === "members"
                    ? "bg-coral text-white"
                    : "text-dark-400 hover:text-white"
                }
              `}
            >
              <Users className="w-4 h-4" />
              <span>Members</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4">
          {activeTab === "discussion" ? (
            <div className="space-y-4">
              {/* New Post Input */}
              {isConnected && isJoined && (
                <div className="card">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-dark-500 mb-3"
                  />
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePost}
                      disabled={!newPost.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-coral text-white text-sm font-medium disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>Post</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {mockPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={post.user.avatar}
                      alt={post.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {post.user.name}
                        </span>
                        <span className="text-xs text-dark-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300 mt-1">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-dark-700">
                    <button className="flex items-center gap-1 text-sm text-dark-400 hover:text-coral transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-dark-400 hover:text-coral transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.replies}</span>
                    </button>
                    <button
                      onClick={() => sharePost(post.content)}
                      className="flex items-center gap-1 text-sm text-dark-400 hover:text-coral transition-colors ml-auto"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mockMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card flex items-center gap-4"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-dark-400">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{member.nfts} NFTs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Joined {member.joinedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && group && (
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
                      {shareContent?.type === "post"
                        ? "Share Post"
                        : "Share Group"}
                    </h3>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-dark-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 mb-4">
                    {shareContent?.type === "post" ? (
                      <div className="flex-1">
                        <p className="text-sm text-dark-300 line-clamp-3">
                          "{shareContent.postContent}"
                        </p>
                        <p className="text-xs text-dark-500 mt-2">
                          from {group.media.title}
                        </p>
                      </div>
                    ) : (
                      <>
                        {group.media.coverImage && (
                          <img
                            src={group.media.coverImage}
                            alt={group.media.title}
                            className="w-12 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">
                            {group.media.title}
                          </h4>
                          <p className="text-sm text-dark-400">
                            {group.memberCount.toLocaleString()} members
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={copyShareLink}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-700 hover:bg-dark-700/80 transition-colors"
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
                          const tweetText =
                            shareContent?.type === "post"
                              ? `Check out this post from the ${
                                  group.media.title
                                } group on VeTerex: "${shareContent.postContent?.slice(
                                  0,
                                  100
                                )}${
                                  (shareContent.postContent?.length || 0) > 100
                                    ? "..."
                                    : ""
                                }"`
                              : `Join me in the ${group.media.title} group on VeTerex!`;
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                              tweetText
                            )}&url=${encodeURIComponent(
                              `${window.location.origin}/#/community/group/${group.id}`
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
                          const shareText =
                            shareContent?.type === "post"
                              ? `Check out this post from the ${
                                  group.media.title
                                } group on VeTerex: "${shareContent.postContent?.slice(
                                  0,
                                  100
                                )}${
                                  (shareContent.postContent?.length || 0) > 100
                                    ? "..."
                                    : ""
                                }"`
                              : `Join me in the ${group.media.title} group on VeTerex!`;
                          window.open(
                            `https://t.me/share/url?url=${encodeURIComponent(
                              `${window.location.origin}/#/community/group/${group.id}`
                            )}&text=${encodeURIComponent(shareText)}`,
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

      {/* Close more menu when clicking outside */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </div>
  );
}
