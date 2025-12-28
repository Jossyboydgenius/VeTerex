import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Book,
  Film,
  Tv,
  BookOpen,
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  Play,
  Activity,
  Globe,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAppStore, type TrackedMedia } from "@/store/useAppStore";
import {
  TrackingPermissionModal,
  TrackedMediaCard,
  MintNFTModal,
} from "@/components";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  typeof chrome.tabs !== "undefined";

interface CurrentSiteInfo {
  url: string;
  hostname: string;
  isSupported: boolean;
  platformName: string | null;
  isTracking: boolean;
}

const mediaTypes = [
  {
    type: "book",
    icon: Book,
    label: "Books",
    color: "from-emerald-500 to-green-600",
  },
  {
    type: "movie",
    icon: Film,
    label: "Movies",
    color: "from-red-500 to-rose-600",
  },
  {
    type: "anime",
    icon: Play,
    label: "Anime",
    color: "from-pink-500 to-fuchsia-600",
  },
  {
    type: "manga",
    icon: BookOpen,
    label: "Manga",
    color: "from-orange-500 to-amber-600",
  },
  {
    type: "tvshow",
    icon: Tv,
    label: "TV Shows",
    color: "from-blue-500 to-indigo-600",
  },
  {
    type: "series",
    icon: Film,
    label: "Series",
    color: "from-violet-500 to-purple-600",
  },
];

const stats = [
  { icon: Award, value: "12,450", label: "NFTs Minted" },
  { icon: Users, value: "3,200", label: "Active Users" },
  { icon: TrendingUp, value: "85K", label: "Completions" },
];

// Stats section temporarily disabled
const SHOW_STATS = false;

// Supported platforms for checking current site
const SUPPORTED_PLATFORMS: Record<string, string[]> = {
  YouTube: ["youtube.com"],
  Netflix: ["netflix.com"],
  "Prime Video": ["primevideo.com", "amazon.com/gp/video"],
  "Disney+": ["disneyplus.com"],
  Hulu: ["hulu.com"],
  Crunchyroll: ["crunchyroll.com"],
  Goodreads: ["goodreads.com"],
  Kindle: ["read.amazon.com"],
  MangaDex: ["mangadex.org"],
  MyAnimeList: ["myanimelist.net"],
  AniList: ["anilist.co"],
};

export function HomePage() {
  const {
    isConnected,
    completions,
    trackingEnabled,
    trackingPermissionAsked,
    activeTracking,
    pendingMints,
    setTrackingEnabled,
    setTrackingPermissionAsked,
    removePendingMint,
    addToast,
  } = useAppStore();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TrackedMedia | null>(null);
  const [currentSite, setCurrentSite] = useState<CurrentSiteInfo | null>(null);

  // Detect current active tab site
  useEffect(() => {
    if (!isExtension) return;

    const detectCurrentSite = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tab = tabs[0];
        if (!tab?.url) return;

        const url = new URL(tab.url);
        const hostname = url.hostname.replace("www.", "");

        // Check if it's a supported platform
        let platformName: string | null = null;
        for (const [name, patterns] of Object.entries(SUPPORTED_PLATFORMS)) {
          if (patterns.some((p) => hostname.includes(p.replace("www.", "")))) {
            platformName = name;
            break;
          }
        }

        // Check custom sites from storage
        if (!platformName) {
          const result = await chrome.storage.local.get(["customSites"]);
          const customSites = result.customSites || [];
          for (const site of customSites) {
            // Extract domain from the site URL
            try {
              const siteUrl = new URL(site.url);
              const siteDomain = siteUrl.hostname.replace("www.", "");
              if (
                hostname.includes(siteDomain) ||
                siteDomain.includes(hostname)
              ) {
                platformName = site.name || siteDomain;
                break;
              }
            } catch {
              // If URL parsing fails, try direct comparison
              const siteDomain = site.url
                .replace(/https?:\/\//, "")
                .replace("www.", "")
                .split("/")[0];
              if (
                hostname.includes(siteDomain) ||
                siteDomain.includes(hostname)
              ) {
                platformName = site.name || siteDomain;
                break;
              }
            }
          }
        }

        setCurrentSite({
          url: tab.url,
          hostname,
          isSupported: platformName !== null,
          platformName,
          isTracking: activeTracking.some((t) => t.url.includes(hostname)),
        });
      } catch (error) {
        console.error("[VeTerex] Error detecting current site:", error);
      }
    };

    detectCurrentSite();
  }, [activeTracking]);

  // Show permission modal on first load if not asked yet
  useEffect(() => {
    if (isConnected && !trackingPermissionAsked) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, trackingPermissionAsked]);

  // Listen for tracking updates from content script
  useEffect(() => {
    // Only run chrome-specific code in extension context
    if (!isExtension) return;

    // Load initial active tracking from storage
    const loadActiveTracking = () => {
      try {
        chrome.storage?.local?.get(["activeTracking"], (result) => {
          if (chrome.runtime.lastError) {
            console.error("[VeTerex] Storage error:", chrome.runtime.lastError);
            return;
          }
          if (result?.activeTracking && Array.isArray(result.activeTracking)) {
            result.activeTracking.forEach((track: TrackedMedia) => {
              useAppStore.getState().updateActiveTracking(track);
            });
          }
        });
      } catch (err) {
        console.error("[VeTerex] Failed to load active tracking:", err);
      }
    };

    // Load on mount
    loadActiveTracking();

    // Also get active sessions from service worker
    try {
      chrome.runtime.sendMessage(
        { type: "GET_ACTIVE_SESSIONS" },
        (response) => {
          if (response?.success && response.data) {
            console.log("[VeTerex] Active sessions:", response.data);
          }
        }
      );
    } catch (err) {
      console.error("[VeTerex] Failed to get active sessions:", err);
    }

    const handleMessage = (message: { type: string; data?: TrackedMedia }) => {
      if (message.type === "TRACKING_UPDATE" && message.data) {
        useAppStore.getState().updateActiveTracking(message.data);
      }
      if (message.type === "MEDIA_COMPLETED" && message.data) {
        useAppStore.getState().addPendingMint(message.data);
      }
    };

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.activeTracking) {
        const newTracking = changes.activeTracking.newValue;
        if (Array.isArray(newTracking)) {
          // Clear and update
          useAppStore.getState().clearActiveTracking();
          newTracking.forEach((track: TrackedMedia) => {
            useAppStore.getState().updateActiveTracking(track);
          });
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.storage?.onChanged?.addListener(handleStorageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      chrome.storage?.onChanged?.removeListener(handleStorageChange);
    };
  }, []);

  const handleAllowTracking = () => {
    setTrackingEnabled(true);
    setTrackingPermissionAsked(true);
    setShowPermissionModal(false);
    addToast({
      type: "success",
      message: "Tracking enabled! We'll track your media progress.",
    });
  };

  const handleDenyTracking = () => {
    setTrackingEnabled(false);
    setTrackingPermissionAsked(true);
    setShowPermissionModal(false);
    addToast({
      type: "info",
      message: "Tracking disabled. You can enable it in Settings.",
    });
  };

  const handleMint = (media: TrackedMedia) => {
    setSelectedMedia(media);
    setShowMintModal(true);
  };

  const handleDismissCompletion = (id: string) => {
    removePendingMint(id);
  };

  // Combine active tracking and pending mints
  const allTrackedMedia = [
    ...pendingMints,
    ...activeTracking.filter((t) => !pendingMints.some((p) => p.id === t.id)),
  ];

  return (
    <div className="px-4 py-6 space-y-8">
      {/* Current Site Indicator - Show in extension when on a supported site */}
      {isExtension && currentSite && isConnected && trackingEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            currentSite.isSupported
              ? currentSite.isTracking
                ? "bg-green-500/10 border-green-500/30"
                : "bg-accent-500/10 border-accent-500/30"
              : "bg-dark-800 border-dark-700"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              currentSite.isSupported
                ? currentSite.isTracking
                  ? "bg-green-500/20"
                  : "bg-accent-500/20"
                : "bg-dark-700"
            }`}
          >
            {currentSite.isSupported ? (
              currentSite.isTracking ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Globe className="w-5 h-5 text-accent-400" />
              )
            ) : (
              <AlertCircle className="w-5 h-5 text-dark-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentSite.platformName || currentSite.hostname}
            </p>
            <p
              className={`text-xs ${
                currentSite.isSupported
                  ? currentSite.isTracking
                    ? "text-green-400"
                    : "text-accent-400"
                  : "text-dark-400"
              }`}
            >
              {currentSite.isSupported
                ? currentSite.isTracking
                  ? "Currently tracking"
                  : "Supported site - Play media to track"
                : "Not a supported site"}
            </p>
          </div>
          {currentSite.isTracking && (
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </motion.div>
      )}

      {/* Tracking Progress Section - Show when connected */}
      {isConnected && trackingEnabled && allTrackedMedia.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-400" />
              <h2 className="text-lg font-semibold text-white">
                Tracking Your Progress
              </h2>
            </div>
            <span className="text-xs text-dark-400 px-2 py-1 bg-dark-800 rounded-full">
              {allTrackedMedia.length} active
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {allTrackedMedia.map((media) => (
                <TrackedMediaCard
                  key={media.id}
                  media={media}
                  onMint={media.completed ? () => handleMint(media) : undefined}
                  onDismiss={
                    media.completed
                      ? () => handleDismissCompletion(media.id)
                      : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      ) : (
        /* Hero Section - Show when not connected or no tracking */
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-24 h-24 mx-auto mb-6"
          >
            <img
              src="/icons/icon.svg"
              alt="VeTerex Logo"
              className="w-full h-full"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display font-bold gradient-text mb-3"
          >
            {isConnected && trackingEnabled
              ? "No Active Tracking"
              : "Track Your Media Journey"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-dark-400 text-sm max-w-xs mx-auto mb-6"
          >
            {isConnected && trackingEnabled
              ? "Visit a supported site like YouTube or Netflix to start tracking your media."
              : "Earn verified NFT badges for every book, movie, anime, and show you complete. Connect with others who share your achievements."}
          </motion.p>

          {!isConnected ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-accent-400"
            >
              Connect your wallet to start tracking
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm text-green-400"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Wallet Connected</span>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Stats - Temporarily disabled */}
      {SHOW_STATS && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map(({ icon: Icon, value, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="card text-center py-4"
            >
              <Icon className="w-5 h-5 mx-auto text-accent-400 mb-2" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-dark-400">{label}</p>
            </motion.div>
          ))}
        </motion.section>
      )}

      {/* Media Types Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Explore by Type</h2>
          <Link
            to="/explore"
            className="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
          >
            <span>See all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mediaTypes.map(({ type, icon: Icon, label, color }, index) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Link to={`/explore?type=${type}`} className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-2xl bg-gradient-to-br ${color}
                    relative overflow-hidden group
                  `}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10">
                    <Icon className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-white">{label}</p>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Your Progress (if connected) */}
      {isConnected && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Progress</h2>
            <Link
              to="/collection"
              className="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 
                            flex items-center justify-center border border-accent-500/30"
              >
                <Award className="w-7 h-7 text-accent-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">
                  {completions.length}
                </p>
                <p className="text-sm text-dark-400">NFTs in your collection</p>
              </div>
              <Link to="/explore" className="btn-primary text-sm py-2 px-4">
                Add More
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

        <Link to="/mint">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="card flex items-center gap-4 hover:border-accent-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Record a Completion</p>
              <p className="text-xs text-dark-400">
                Mark a book, movie, or show as completed
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-dark-500" />
          </motion.div>
        </Link>

        <Link to="/community">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="card flex items-center gap-4 hover:border-accent-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Find Your Community</p>
              <p className="text-xs text-dark-400">
                Connect with others who share your interests
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-dark-500" />
          </motion.div>
        </Link>
      </motion.section>

      {/* Tracking Permission Modal */}
      <TrackingPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onAllow={handleAllowTracking}
        onDeny={handleDenyTracking}
      />

      {/* Mint NFT Modal */}
      {selectedMedia && (
        <MintNFTModal
          isOpen={showMintModal}
          onClose={() => {
            setShowMintModal(false);
            setSelectedMedia(null);
          }}
          media={{
            id: selectedMedia.id,
            externalId: selectedMedia.id,
            title: selectedMedia.title,
            type: selectedMedia.type as
              | "book"
              | "movie"
              | "anime"
              | "manga"
              | "comic"
              | "tvshow",
            description: `Completed on ${selectedMedia.platform}`,
            coverImage: selectedMedia.thumbnail || "",
            releaseYear: new Date().getFullYear(),
            creator: selectedMedia.platform,
            genre: [selectedMedia.type],
            totalCompletions: 1,
          }}
          onSuccess={() => {
            removePendingMint(selectedMedia.id);
            setShowMintModal(false);
            setSelectedMedia(null);
            addToast({
              type: "success",
              message: "NFT minted successfully! 🎉",
            });
          }}
        />
      )}
    </div>
  );
}
