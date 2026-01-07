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
  Plus,
  X,
  Power,
} from "lucide-react";
import { useAppStore, type TrackedMedia } from "@/store/useAppStore";
import { getUserNFTCount } from "@/services/nft";
import {
  TrackingPermissionModal,
  TrackedMediaCard,
  MintNFTModal,
  CustomDropdown,
  SeriesBookmarksPanel,
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
  isEnabled: boolean;
  domain: string; // The domain to request permission for
  activeTrackingCount?: number;
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
  // Free streaming sites - Movies & TV
  Hurawatch: ["hurawatch.tw", "hurawatch.cc"],
  Filmboom: ["filmboom.top", "moviebox.ph"],
  "9anime": ["9animetv.to", "9anime.to", "9anime.gs"],
  Moviebox: ["moviebox.ph"],
  Fmovies: ["fmovies.to", "fmovies.wtf", "fmovies.co", "ww4.fmovies.co"],
  SolarMovie: [
    "solarmovie.pe",
    "solarmovie.to",
    "solarmovie.one",
    "wwv.solarmovie.one",
    "solarmovie.cr",
    "www3.solarmovie.cr",
  ],
  GogoAnime: ["gogoanime.hu", "gogoanime.gg", "anitaku.to", "gogoanime.by"],
  Zoro: ["zoro.to", "aniwatch.to", "zoroto.se", "www.zoroto.se"],
  Animixplay: ["animixplay.to"],
  Webtoon: ["webtoons.com"],
  Tapas: ["tapas.io"],
  Comick: ["comick.io", "comick.fun", "comick.dev"],
  Mangakakalot: ["mangakakalot.com", "manganato.com", "mangakakalot.to"],
  Mangasee: ["mangasee123.com", "weebcentral.com"],
  Bato: ["bato.to", "bato.si"],
  ReadComicOnline: ["readcomiconline.li"],
  "123Movies": ["123movies.ai", "123movies.to"],
  Putlocker: ["putlocker.vip"],
  YesMovies: ["yesmovies.ag", "yesmovies.to"],
  Soap2day: ["soap2day.to", "soap2day.rs", "soap2day.day", "ww25.soap2day.day"],
  Animepahe: ["animepahe.com", "animepahe.ru"],
  // Drama sites
  KissKH: ["kisskh.id", "kisskh.me", "kisskh.co"],
  Dramahood: ["dramahood.mom", "dramahood.se", "dramahood.cc"],
  GoPlay: ["goplay.ml", "goplay.gg"],
  DramaCool: ["dramacool.net.lc", "dramacool.sr", "dramacool.cr", "asianc.co"],
  // Additional manga sites
  ComixTo: ["comix.to"],
  WeebCentral: ["weebcentral.com"],
  // ========== ANIME STREAMING SITES ==========
  AnimeKai: ["animekai.to", "animekai.cc"],
  AniWave: ["aniwave.to", "aniwave.cc", "aniwave.se", "aniwave.live"],
  AniWatch: ["aniwatch.to", "aniwatch.cc"],
  AllAnimeG: ["allanimeg.to", "allanimeg.com"],
  AniZone: ["anizone.to", "anizone.cc"],
  AnimeSuge: ["animesuge.to", "animesuge.cc"],
  Anix: ["anix.to", "anix.vc"],
  HiAnime: ["hianime.to", "hianime.tv"],
  Kaido: ["kaido.to", "kaido.cc"],
  AnimeOnsen: ["animeonsen.xyz"],
  AnimeOwl: ["animeowl.live", "animeowl.me"],
  AnimeFox: ["animefox.tv", "animefox.cc"],
  AnimeDao: ["animedao.to", "animedao.cc"],
  AnimeFLV: ["animeflv.net", "animeflv.ws"],
  AniCrush: ["anicrush.to"],
  AnimeGG: ["animegg.org"],
  AnimeLand: ["animeland.tv"],
  Animension: ["animension.to"],
  AnimeSA: ["animesa.ga"],
  AnimeSaturn: ["animesaturn.cx", "animesaturn.tv"],
  AnimeToast: ["animetoast.cc"],
  AnimeXin: ["animexin.vip"],
  AsianLoad: ["asianload.cc", "asianload.io"],
  YugenAnime: ["yugenanime.ro", "yugenanime.tv"],
  KickAssAnime: ["kickassanime.am", "kickassanime.mx"],
  AnimeFire: ["animefire.plus", "animefire.net"],
  AnimeFenix: ["animefenix.tv"],
  AnimeKisa: ["animekisa.in"],
  AnimeKu: ["animeku.me"],
  BetterAnime: ["betteranime.net"],
  Bilibili: ["bilibili.tv", "bilibili.com"],
  MonosChinos: ["monoschinos.net", "monoschinos2.com"],
  Nanime: ["nanime.co", "nanime.biz"],
  NekoSama: ["neko-sama.fr"],
  OtakuDesu: ["otakudesu.cloud", "otakudesu.cam"],
  SuperAnimes: ["superanimes.org"],
  TioAnime: ["tioanime.com"],
  WCOFun: ["wcofun.cc", "wcofun.org", "wcoforever.org", "wcoforever.net"],
  JKAnime: ["jkanime.net"],
  // ========== MANGA/MANHWA/MANHUA SITES ==========
  MangaHere: ["mangahere.cc", "mangahere.us"],
  MangaPark: ["mangapark.net", "mangapark.to"],
  MangaReader: ["mangareader.to", "mangareader.cc"],
  MangaBuddy: ["mangabuddy.com"],
  MangaClash: ["mangaclash.com"],
  MangaFire: ["mangafire.to"],
  MangaGo: ["mangago.me"],
  MangaHub: ["mangahub.io"],
  MangaIro: ["mangairo.com"],
  MangaKomi: ["mangakomi.io"],
  MangaLife: ["mangalife.us", "manga4life.com"],
  Manganato: ["manganato.com", "chapmanganato.to"],
  MangaOwl: ["mangaowl.to"],
  MangaPill: ["mangapill.com"],
  MangaPlex: ["mangaplex.com"],
  MangaTX: ["mangatx.com"],
  MangaWorld: ["mangaworld.ac"],
  TCBScans: ["tcbscans.me", "tcbscans.com"],
  Toonily: ["toonily.com", "toonily.net"],
  Toonkor: ["toonkor.se"],
  ReaperScans: ["reaperscans.com"],
  AsuraScans: ["asurascans.com", "asuracomic.net"],
  FlameComics: ["flamecomics.com", "flamecomics.me"],
  LuminousScans: ["luminousscans.net", "luminousscans.com"],
  // ========== DONGHUA SITES ==========
  DonghuaStream: ["donghuastream.com"],
  LuciferDonghua: ["luciferdonghua.in"],
  MyAnime: ["myanime.live"],
  AnimeKhor: ["animekhor.xyz"],
  iQIYI: ["iq.com", "iqiyi.com"],
  Youku: ["youku.tv", "youku.com"],
  // ========== NOVEL/LIGHT NOVEL SITES ==========
  NovelUpdates: ["novelupdates.com"],
  WuxiaWorld: ["wuxiaworld.com", "wuxiaworld.site"],
  RoyalRoad: ["royalroad.com"],
  WebNovel: ["webnovel.com"],
  LightNovelCave: ["lightnovelcave.com", "lightnovelworld.com"],
  ReadLightNovel: ["readlightnovel.me", "readlightnovel.today"],
  NovelFull: ["novelfull.com"],
  NovelBin: ["novelbin.com", "novelbin.me"],
  ScribbleHub: ["scribblehub.com"],
  FreeWebNovel: ["freewebnovel.com"],
  MTLNovel: ["mtlnovel.com"],
  // ========== MOVIE/TV STREAMING SITES ==========
  FlixHQ: ["flixhq.to", "flixhq.net"],
  LookMovie: ["lookmovie.io", "lookmovie2.to"],
  HDToday: ["hdtoday.cc", "hdtoday.tv"],
  MoviesJoy: ["moviesjoy.to", "moviesjoy.is"],
  KissAsian: ["kissasian.li", "kissasian.fan"],
  DopeBox: ["dopebox.to", "dopebox.se"],
  Sflix: ["sflix.to", "sflix.se"],
  BFlixTo: ["bflix.to", "bflix.gs"],
  MyFlixer: ["myflixer.to", "myflixer.today"],
  CineZone: ["cinezone.to"],
  WatchOMovies: ["watchomovies.com"],
  Goojara: ["goojara.to", "goojarawatch.com"],
  Vumoo: ["vumoo.to", "vumoo.life"],
  PrimeWire: ["primewire.tf", "primewire.li"],
  AZMovies: ["azmovies.net"],
  WatchSeries: ["watchseries.id", "watchserieshd.tv"],
  StreamingCommunity: ["streamingcommunity.photos"],
};

export function HomePage() {
  const {
    isConnected,
    completions,
    trackingEnabled,
    trackingPermissionAsked,
    activeTracking,
    pendingMints,
    currentAccount,
    setTrackingEnabled,
    setTrackingPermissionAsked,
    removePendingMint,
    removeActiveTracking,
    addToast,
  } = useAppStore();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<TrackedMedia | null>(null);
  const [currentSite, setCurrentSite] = useState<CurrentSiteInfo | null>(null);
  const [nftCount, setNftCount] = useState<number>(0);

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
        let platformDomain: string = hostname;

        for (const [name, patterns] of Object.entries(SUPPORTED_PLATFORMS)) {
          if (patterns.some((p) => hostname.includes(p.replace("www.", "")))) {
            platformName = name;
            // Find the matching pattern domain
            const matchingPattern = patterns.find((p) =>
              hostname.includes(p.replace("www.", ""))
            );
            if (matchingPattern) {
              platformDomain = matchingPattern.replace("www.", "");
            }
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
                platformDomain = siteDomain;
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
                platformDomain = siteDomain;
                break;
              }
            }
          }
        }

        // Check if we have permission for this domain
        let isEnabled = false;
        if (platformName) {
          const permissions = await chrome.permissions.getAll();
          const origins = permissions.origins || [];
          isEnabled = origins.some((o) => o.includes(platformDomain));
        }

        const siteInfo = {
          url: tab.url,
          hostname,
          isSupported: platformName !== null,
          platformName,
          isTracking: activeTracking.some((t) => t.url.includes(hostname)),
          isEnabled,
          domain: platformDomain,
          activeTrackingCount: activeTracking.length,
        };
        console.log("[VeTerex Popup] Current site detection:", siteInfo);
        setCurrentSite(siteInfo);
      } catch (error) {
        console.error("[VeTerex] Error detecting current site:", error);
      }
    };

    detectCurrentSite();
  }, [activeTracking]);

  // Fetch NFT count from smart contract when wallet is connected
  useEffect(() => {
    const fetchNFTCount = async () => {
      const walletAddress = currentAccount?.address;
      if (walletAddress) {
        try {
          const count = await getUserNFTCount(walletAddress as `0x${string}`);
          setNftCount(count);
        } catch (error) {
          console.error("[HomePage] Error fetching NFT count:", error);
          // Fallback to local completions count
          setNftCount(completions.length);
        }
      } else {
        // Use local count if no wallet connected
        setNftCount(completions.length);
      }
    };

    fetchNFTCount();
  }, [currentAccount?.address, completions.length]);

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
          console.log("[VeTerex Popup] Loaded tracking data:", {
            activeTracking: result?.activeTracking || [],
            count: result?.activeTracking?.length || 0,
          });
          if (result?.activeTracking && Array.isArray(result.activeTracking)) {
            result.activeTracking.forEach((track: TrackedMedia) => {
              console.log("[VeTerex Popup] Updating tracking item:", track);
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
    // Also remove from chrome.storage to prevent persistence
    if (isExtension && chrome.storage?.local) {
      chrome.storage.local.get(["activeTracking", "pendingMint"], (result) => {
        // Remove from activeTracking in storage
        if (result.activeTracking && Array.isArray(result.activeTracking)) {
          const filtered = result.activeTracking.filter(
            (t: TrackedMedia) => t.id !== media.id && t.title !== media.title
          );
          chrome.storage.local.set({ activeTracking: filtered });
        }
        // Clear pendingMint if it matches
        if (
          result.pendingMint &&
          (result.pendingMint.title === media.title ||
            result.pendingMint.id === media.id)
        ) {
          chrome.storage.local.remove(["pendingMint"]);
        }
      });
    }
  };

  const handleDismissCompletion = (id: string) => {
    // Remove from both pendingMints and activeTracking
    removePendingMint(id);
    removeActiveTracking(id);
    // Also clear from chrome.storage to prevent persistence
    if (isExtension && chrome.storage?.local) {
      chrome.storage.local.get(
        ["activeTracking", "pendingMint", "pendingCompletions"],
        (result) => {
          // Remove from activeTracking in storage
          if (result.activeTracking && Array.isArray(result.activeTracking)) {
            const filtered = result.activeTracking.filter(
              (t: TrackedMedia) => t.id !== id
            );
            chrome.storage.local.set({ activeTracking: filtered });
          }
          // Remove from pendingCompletions in storage
          if (
            result.pendingCompletions &&
            Array.isArray(result.pendingCompletions)
          ) {
            const filtered = result.pendingCompletions.filter(
              (t: any) => t.id !== id
            );
            chrome.storage.local.set({ pendingCompletions: filtered });
          }
        }
      );
    }
  };

  // Add custom site handler
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [prefillSiteUrl, setPrefillSiteUrl] = useState("");
  const [prefillSiteName, setPrefillSiteName] = useState("");

  const handleAddCustomSite = () => {
    if (currentSite) {
      setPrefillSiteUrl(currentSite.hostname);
      // Generate a clean name from hostname (e.g., "9animetv.to" -> "9animetv")
      // and capitalize the first letter (e.g., "everythingmoe" -> "Everythingmoe")
      const cleanName = currentSite.hostname
        .replace(
          /\.(com|net|org|io|to|tv|cc|ph|top|tw|gs|hu|gg|pe|ag|rs|ai|vip|li|fun|dev|si|id|mom|ml|lc|cr|se|by|day|one|co)$/i,
          ""
        )
        .replace(/^www\./, "")
        .replace(/^ww\d*\./, ""); // Remove prefixes like ww4., ww25., etc.
      // Capitalize first letter
      const capitalizedName =
        cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setPrefillSiteName(capitalizedName);
      setShowAddSiteModal(true);
    }
  };

  // Enable tracking for a supported but disabled site
  const handleEnableSite = async () => {
    if (!currentSite || !isExtension) return;

    try {
      const domain = currentSite.domain;
      const granted = await chrome.permissions.request({
        origins: [`https://*.${domain}/*`],
      });

      if (granted) {
        addToast({
          type: "success",
          message: `Tracking enabled for ${currentSite.platformName || domain}`,
        });
        // Update current site state to reflect the change
        setCurrentSite((prev) => (prev ? { ...prev, isEnabled: true } : null));
      } else {
        addToast({
          type: "error",
          message: `Permission denied for ${
            currentSite.platformName || domain
          }`,
        });
      }
    } catch (error) {
      console.error("[VeTerex] Failed to enable tracking:", error);
      addToast({
        type: "error",
        message: "Failed to enable tracking",
      });
    }
  };

  // Combine active tracking and pending mints
  const allTrackedMedia = [
    ...pendingMints,
    ...activeTracking.filter((t) => !pendingMints.some((p) => p.id === t.id)),
  ];

  // Debug logging for tracked media
  console.log("[VeTerex Popup] All tracked media:", {
    pendingMints: pendingMints.length,
    activeTracking: activeTracking.length,
    allTrackedMedia: allTrackedMedia.length,
    items: allTrackedMedia,
  });

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
                ? "bg-brand-green/10 border-brand-green/30"
                : currentSite.isEnabled
                ? "bg-coral/10 border-coral/30"
                : "bg-brand-yellow/10 border-brand-yellow/30"
              : "bg-dark-800 border-dark-700"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              currentSite.isSupported
                ? currentSite.isTracking
                  ? "bg-brand-green/20"
                  : currentSite.isEnabled
                  ? "bg-coral/20"
                  : "bg-brand-yellow/20"
                : "bg-dark-700"
            }`}
          >
            {currentSite.isSupported ? (
              currentSite.isTracking ? (
                <CheckCircle className="w-5 h-5 text-brand-green" />
              ) : currentSite.isEnabled ? (
                <Globe className="w-5 h-5 text-coral" />
              ) : (
                <Power className="w-5 h-5 text-brand-yellow" />
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
                    ? "text-brand-green"
                    : currentSite.isEnabled
                    ? "text-coral"
                    : "text-brand-yellow"
                  : "text-dark-400"
              }`}
            >
              {currentSite.isSupported
                ? currentSite.isTracking
                  ? "Currently tracking"
                  : currentSite.isEnabled
                  ? "Supported site - Play media to track"
                  : "Supported site - Enable to track"
                : "Not a supported site"}
            </p>
          </div>
          {currentSite.isTracking ? (
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          ) : currentSite.isSupported && !currentSite.isEnabled ? (
            <button
              onClick={handleEnableSite}
              className="px-3 py-1.5 text-xs font-medium text-white 
                       bg-gradient-to-r from-brand-yellow to-brand-yellow 
                       rounded-lg hover:opacity-90 
                       transition-all duration-200 flex items-center gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              Enable
            </button>
          ) : !currentSite.isSupported ? (
            <button
              onClick={handleAddCustomSite}
              className="px-3 py-1.5 text-xs font-medium text-white 
                       bg-main-gradient 
                       rounded-lg hover:opacity-90 
                       transition-all duration-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Site
            </button>
          ) : null}
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
              <Activity className="w-5 h-5 text-coral" />
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
              className="text-sm text-coral"
            >
              Connect your wallet to start tracking
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm text-brand-green"
            >
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span>Wallet Connected</span>
            </motion.div>
          )}
        </motion.section>
      )}

      {/* Series Bookmarks */}
      {isExtension && <SeriesBookmarksPanel />}

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
              <Icon className="w-5 h-5 mx-auto text-coral mb-2" />
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
            to="/collection"
            className="flex items-center gap-1 text-sm text-coral hover:text-coral-light"
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
              <Link to={`/collection?filter=${type}`} className="block">
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
              className="flex items-center gap-1 text-sm text-coral hover:text-coral-light"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-coral/20 to-violet/20 
                            flex items-center justify-center border border-coral/30"
              >
                <Award className="w-7 h-7 text-coral" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">{nftCount}</p>
                <p className="text-xs text-dark-400">NFTs in your collection</p>
              </div>
              <Link to="/community" className="btn-primary text-sm py-2 px-4">
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
            className="card flex items-center gap-4 hover:border-coral/50"
          >
            <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-coral" />
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
            className="card flex items-center gap-4 hover:border-coral/50"
          >
            <div className="w-10 h-10 rounded-xl bg-violet/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet" />
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
            // Toast is already shown in MintNFTModal
          }}
        />
      )}

      {/* Add Custom Site Modal */}
      <AddCustomSiteModal
        isOpen={showAddSiteModal}
        onClose={() => {
          setShowAddSiteModal(false);
          setPrefillSiteUrl("");
          setPrefillSiteName("");
        }}
        prefillUrl={prefillSiteUrl}
        prefillName={prefillSiteName}
        onSuccess={() => {
          setShowAddSiteModal(false);
          setPrefillSiteUrl("");
          setPrefillSiteName("");
          addToast({
            type: "success",
            message: "Custom site added successfully!",
          });
          // Refresh current site detection
          if (currentSite) {
            setCurrentSite({
              ...currentSite,
              isSupported: true,
              platformName: prefillSiteName,
            });
          }
        }}
      />
    </div>
  );
}

// Add Custom Site Modal Component
interface AddCustomSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillUrl: string;
  prefillName: string;
  onSuccess: () => void;
}

function AddCustomSiteModal({
  isOpen,
  onClose,
  prefillUrl,
  prefillName,
  onSuccess,
}: AddCustomSiteModalProps) {
  const [siteName, setSiteName] = useState(prefillName);
  const [siteUrl, setSiteUrl] = useState(prefillUrl);
  const [siteType, setSiteType] = useState("movie");
  const { addToast } = useAppStore();

  // Update state when prefill values change
  useEffect(() => {
    setSiteName(prefillName);
    setSiteUrl(prefillUrl);
  }, [prefillName, prefillUrl]);

  const handleAddSite = async () => {
    if (!siteName || !siteUrl) {
      addToast({ type: "error", message: "Please fill in all fields" });
      return;
    }

    try {
      const url = new URL(
        siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`
      );

      const newSite = {
        id: `custom-${Date.now()}`,
        url: url.origin,
        name: siteName,
        type: siteType,
        enabled: true,
      };

      // Get existing custom sites and add new one
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["customSites"], (result) => {
          const existingCustomSites = result.customSites || [];
          const updatedSites = [...existingCustomSites, newSite];
          chrome.storage.local.set({ customSites: updatedSites }, () => {
            onSuccess();
          });
        });
      } else {
        // Fallback for non-extension environment
        onSuccess();
      }
    } catch {
      addToast({ type: "error", message: "Invalid URL format" });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
      />
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <div className="bg-dark-900 rounded-2xl border border-dark-700 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add Custom Website
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Website Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g., 9anime"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Website URL
                </label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="e.g., 9animetv.to"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Media Type
                </label>
                <CustomDropdown
                  value={siteType}
                  onChange={setSiteType}
                  options={[
                    { value: "movie", label: "Movie" },
                    { value: "tvshow", label: "TV Show" },
                    { value: "anime", label: "Anime" },
                    { value: "book", label: "Book" },
                    { value: "manga", label: "Manga" },
                    { value: "video", label: "Video" },
                  ]}
                  placeholder="Select media type"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-dark-700 text-dark-300 font-medium"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddSite}
                className="flex-1 py-2.5 rounded-xl bg-coral text-white font-medium"
              >
                Add Site
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
