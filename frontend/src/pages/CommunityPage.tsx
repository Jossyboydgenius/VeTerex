import { useEffect, useState } from "react";
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
  Radio,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Group } from "@/types";
import { readUserNfts, getSimilars, getTokensMetadata, getGroupMemberCount } from "@/services/nft";
// import { getChannels } from "@/services/verychat";
 

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

export function CommunityPage() {
  const { isConnected, addToast, currentAccount } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"groups" | "matches" | "channels">("groups");
  const [channelTab, setChannelTab] = useState<"new" | "popular" | "subscribed">("new");
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);
  const [matchingAddrs, setMatchingAddrs] = useState<string[]>([]);
  const [userNftIds, setUserNftIds] = useState<bigint[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // const [veryChannels, setVeryChannels] = useState<any[]>([]); // Removed unused variable

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

  useEffect(() => {
    async function loadMatches() {
      if (!isConnected || !currentAccount?.address) return
      const ids = await readUserNfts(currentAccount.address as `0x${string}`)
      setUserNftIds(ids)
      const similars = await getSimilars(currentAccount.address as `0x${string}`, ids)
      setMatchingAddrs(similars)
    }
    if (activeTab === "matches") loadMatches()
  }, [activeTab, isConnected, currentAccount?.address])
  
  useEffect(() => {
    async function loadGroups() {
      if (!isConnected || !currentAccount?.address) return
      const ids = await readUserNfts(currentAccount.address as `0x${string}`)
      const metas = await getTokensMetadata(ids)
      const built: Group[] = []
      for (const m of metas) {
        const count = await getGroupMemberCount(m.mediaId as any)
        
        // Parse metadata
        let title = m.uri || "Achievement"
        let coverImage = m.tokenURI || ""
        let externalId = m.uri || ""
        let description = ""

        if (m.uri && m.uri.startsWith("data:application/json")) {
          try {
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
        } else if (m.uri) {
          // If not a data URI, try to format the title if it looks like a URL
          if (m.uri.startsWith('http')) {
             title = formatTitle(m.uri);
          }
        }

        built.push({
          id: m.mediaId,
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
            totalCompletions: Number(count),
          },
          members: [],
          memberCount: Number(count),
          createdAt: new Date(),
          recentActivity: [],
        })
      }
      setGroups(built)
    }
    if (activeTab === "groups") loadGroups()
  }, [activeTab, isConnected, currentAccount?.address])

      useEffect(() => {
    // Placeholder for channel data loading if needed in the future
  }, [activeTab])

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
      <div className="flex gap-2 p-1 bg-dark-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("groups")}
          className={`
            flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
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
            flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
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
        <button
          onClick={() => setActiveTab("channels")}
          className={`
            flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              activeTab === "channels"
                ? "bg-coral text-white"
                : "text-dark-400 hover:text-white"
            }
          `}
        >
          <Radio className="w-4 h-4" />
          <span>VeryChat</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "groups" ? (
        <div className="space-y-4">
          {/* Your Groups Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Media Groups</h2>
            <span className="text-sm text-dark-400">
              {groups.length} groups available
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-dark-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Groups Yet</h3>
              <p className="text-dark-400 max-w-xs">
                Mint NFTs to join groups related to your completed media.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, index) => (
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
          )}
        </div>
      ) : activeTab === "matches" ? (
        <div className="space-y-6">
          {/* Matches Info */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
            className="card bg-gradient-to-br from-coral/10 to-violet/10 border-coral/30"
          >
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
          </motion.div>

          {/* Matching Users */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              People Like You
            </h2>

            {matchingAddrs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-dark-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Matches Yet</h3>
                <p className="text-dark-400 max-w-xs">
                  Mint more NFTs to find people with similar taste!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchingAddrs.map((addr, index) => (
                  <motion.div
                    key={addr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="card flex items-center gap-4 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center text-white">
                      {addr.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {addr}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-coral">
                        <Award className="w-3 h-3" />
                        <span>{userNftIds.length} matching NFTs</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFriend(addr)}
                      className={`p-2 rounded-lg transition-colors ${
                        addedFriends.has(addr)
                          ? "bg-brand-green/20 text-brand-green"
                          : "bg-coral/20 text-coral hover:bg-coral/30"
                      }`}
                    >
                      {addedFriends.has(addr) ? (
                        <UserCheck className="w-5 h-5" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-bold text-white">Channel</h2>
            <div className="flex gap-4">
              <button className="text-white hover:text-coral transition-colors">
                <span className="sr-only">Search</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
              <button className="text-white hover:text-coral transition-colors">
                <span className="sr-only">Create</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              </button>
            </div>
          </div>
          
          <div className="flex border-b border-dark-700 mb-4">
            <button 
              onClick={() => setChannelTab("new")}
              className={`flex-1 pb-3 font-medium text-center transition-colors ${channelTab === "new" ? "text-coral border-b-2 border-coral" : "text-dark-400 hover:text-white"}`}
            >
              New
            </button>
            <button 
              onClick={() => setChannelTab("popular")}
              className={`flex-1 pb-3 font-medium text-center transition-colors ${channelTab === "popular" ? "text-coral border-b-2 border-coral" : "text-dark-400 hover:text-white"}`}
            >
              Popular
            </button>
            <button 
              onClick={() => setChannelTab("subscribed")}
              className={`flex-1 pb-3 font-medium text-center transition-colors ${channelTab === "subscribed" ? "text-coral border-b-2 border-coral" : "text-dark-400 hover:text-white"}`}
            >
              Subscribed
            </button>
          </div>

          {channelTab === "subscribed" ? (
            <div className="space-y-6">
              {/* Event Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 border border-dark-700">
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-16 h-16 relative">
                     {/* Gift Box Icon */}
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 rounded-full blur-xl opacity-20"></div>
                     <img src="/icons/gift-box.png" alt="Gift" className="w-full h-full object-contain transform rotate-12 drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-6 pr-24">
                  <h3 className="text-white font-bold text-lg mb-1">Festive <span className="text-coral">Double Mining Event!</span></h3>
                  <p className="text-dark-300 text-sm">Find out more</p>
                </div>
              </div>

              {/* No Subscribed Channels State */}
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 mb-4 relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-md opacity-20"></div>
                   <img src="/icons/fruit.png" alt="Fruit" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                <h3 className="text-white font-medium text-lg mb-1">No Subscribed Channels</h3>
                <p className="text-dark-400 text-sm">Subscribe to channels to earn ad rewards</p>
              </div>

              {/* Recommended Channels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Recommended Channels</h3>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-dark-600"></div>
                    <div className="w-2 h-2 rounded-full bg-coral"></div>
                    <div className="w-2 h-2 rounded-full bg-dark-600"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Dunia Blockchain Indonesia", desc: "Your source for blockchain & crypto insights", members: "1,144", icon: "🌐", color: "from-blue-500 to-cyan-500" },
                    { name: "영차차 (이벤트 폭탄)", desc: "2,577명 참여 중", members: "2,577", icon: "🐻", color: "from-pink-400 to-rose-400" },
                    { name: "리에이스 소통&정보방", desc: "유튜버 리에이스의 소통 및 정보공유 채널입니다.", members: "5,330", icon: "🃏", color: "from-purple-500 to-indigo-500" }
                  ].map((channel, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      className="bg-dark-800 rounded-xl p-3 flex items-center gap-4 cursor-pointer border border-dark-700"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-2xl shadow-lg`}>
                        {channel.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-pink-500 text-xs">👑</span>
                          <h4 className="text-white font-medium truncate">{channel.name}</h4>
                        </div>
                        <p className="text-dark-400 text-xs truncate">{channel.desc}</p>
                        {channel.name.includes("Dunia") && <p className="text-coral text-xs mt-0.5">{channel.members}명 참여 중</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            {/* Feed Item 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 rounded-xl p-4 border border-dark-700"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#f4d35e] flex items-center justify-center text-dark-900 font-bold border-2 border-dark-700 shadow-sm">
                  B
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Mining app</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-900/50 rounded-xl p-3 mb-2">
                <p className="text-dark-200 text-sm mb-3">
                  Tenaz is a revolutionary blockchain network designed to link digital currency and everyday spending. To claim 1 free Tenaz and start mining for more, follow this link
                </p>
                <a href="#" className="text-blue-400 text-sm block mb-3 break-all hover:underline">https://tenaz.minetenaz.com/esbone</a>
                <p className="text-dark-200 text-sm mb-3">and use my username (esbone) as your invitation code.</p>
                
                <div className="bg-black rounded-xl overflow-hidden border border-dark-700">
                  <div className="p-3 flex items-center justify-between border-b border-dark-700 bg-dark-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm flex items-center gap-1">
                          Tenaz
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="text-dark-400 text-xs">@minetenaz</div>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-dark-700 rounded-full text-xs font-medium text-white hover:bg-dark-600 transition-colors">Following</button>
                  </div>
                  <div className="p-3">
                    <p className="text-dark-300 text-xs leading-relaxed">⚡ With a vision of bridging the gap between DeFi and daily spending, we aim to leverage...</p>
                    <div className="mt-2 text-right">
                      <button className="text-coral text-xs hover:text-white transition-colors">Show More</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-dark-500 text-xs">
                <span>25/12/30 03:59 PM</span>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-coral transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>1</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-coral transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Feed Item 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800 rounded-xl p-4 border border-dark-700"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#f4d35e] flex items-center justify-center text-dark-900 font-bold border-2 border-dark-700 shadow-sm">
                  B
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Mining app</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-900/50 rounded-xl p-3 mb-2">
                <p className="text-dark-200 text-sm mb-2">Crypto with Amal :</p>
                <p className="text-white font-medium text-sm mb-2">🌱 *GREEN EARTH ACTION(GEA)Airdrop* 🚀</p>
                <p className="text-dark-200 text-sm mb-2">Followed By Meta Earth wallet *📊 Token Value:* 1 $GEA = (3$ Exp) *🎁 Reward:* 1GEA token after KYC👥 *Referral Bonus:* Get 0.1GEA per invite!</p>
                <p className="text-dark-200 text-sm">How to Get Started:⤵️ * 1️⃣ Register: <a href="#" className="text-blue-400 hover:underline">https://i.gea-</a></p>
                
                {/* Second Item Link Preview - as seen in screenshot 2 */}
                <div className="mt-3 bg-dark-900 rounded-lg p-3 border border-dark-700">
                   <p className="text-white text-sm font-medium">Register</p>
                   <p className="text-dark-400 text-xs mt-1">i.gea-sign.space</p>
                   <div className="mt-2 flex items-center gap-2 text-xs text-dark-300">
                     <span>Referral Code: j5c83lh3</span>
                     <button className="text-coral hover:underline">Copy</button>
                   </div>
                </div>
                
                <div className="mt-3 space-y-1 text-sm text-dark-300">
                   <p>2️⃣ Download and open the GEA app</p>
                   <p>3️⃣ Tap *"MY"* and complete your *KYC immediately* 🛡️ Verification is faster than MePASS!</p>
                   <p>💰 Once verified, receive 1 GEA instantly ☑️ Do your daily check-in Quiz ♻️ Share your referral link</p>
                </div>
                
                <div className="mt-2 text-right">
                  <button className="text-coral text-xs hover:text-white transition-colors">Show More</button>
                </div>
              </div>
              
               <div className="flex items-center justify-between mt-2 text-dark-500 text-xs">
                <span>25/12/30 08:00 PM</span>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-coral transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>4</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-coral transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Feed Item 3 - Milifit */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800 rounded-xl p-4 border border-dark-700"
            >
               <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-dark-700 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop" alt="Milifit" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Milifit</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-dark-700">
                 <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop" alt="Workout" className="w-full h-auto" />
              </div>
            </motion.div>
            </div>
          )}
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
