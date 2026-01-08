import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Bell,
  Globe,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  X,
  Edit2,
  Activity,
  ExternalLink,
  Search,
  Key,
  Copy,
  Eye,
  EyeOff,
  Smartphone,
  Download,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { isExtension } from "@/services/tracking";
import { CustomDropdown } from "@/components/CustomDropdown";
import {
  exportPrivateKey,
  exportRecoveryPhrase,
  isWalletEncrypted,
} from "@/services/wallet";
import { WalletBackupModal } from "@/components/WalletBackupModal";

interface CustomSite {
  id: string;
  url: string;
  name: string;
  type: string;
  enabled: boolean;
}

// Default supported platforms
const defaultPlatforms = [
  { name: "Netflix", domain: "netflix.com", type: "tvshow" },
  { name: "YouTube", domain: "youtube.com", type: "video" },
  { name: "Prime Video", domain: "primevideo.com", type: "movie" },
  { name: "Disney+", domain: "disneyplus.com", type: "movie" },
  { name: "Hulu", domain: "hulu.com", type: "tvshow" },
  { name: "Crunchyroll", domain: "crunchyroll.com", type: "anime" },
  { name: "Goodreads", domain: "goodreads.com", type: "book" },
  { name: "MangaDex", domain: "mangadex.org", type: "manga" },
  { name: "MyAnimeList", domain: "myanimelist.net", type: "anime" },
  { name: "AniList", domain: "anilist.co", type: "anime" },
  // Free streaming sites - Movies & TV
  { name: "Hurawatch", domain: "hurawatch.tw", type: "movie" },
  { name: "Filmboom", domain: "filmboom.top", type: "movie" },
  { name: "Moviebox", domain: "moviebox.ph", type: "movie" },
  { name: "Fmovies", domain: "ww4.fmovies.co", type: "movie" },
  { name: "SolarMovie", domain: "wwv.solarmovie.one", type: "movie" },
  { name: "123Movies", domain: "123movies.ai", type: "movie" },
  { name: "Putlocker", domain: "putlocker.vip", type: "movie" },
  { name: "YesMovies", domain: "yesmovies.ag", type: "movie" },
  { name: "Soap2day", domain: "ww25.soap2day.day", type: "tvshow" },
  { name: "FlixHQ", domain: "flixhq.to", type: "movie" },
  { name: "LookMovie", domain: "lookmovie.io", type: "movie" },
  { name: "HDToday", domain: "hdtoday.cc", type: "movie" },
  { name: "MoviesJoy", domain: "moviesjoy.to", type: "movie" },
  { name: "DopeBox", domain: "dopebox.to", type: "movie" },
  { name: "Sflix", domain: "sflix.to", type: "movie" },
  { name: "BFlixTo", domain: "bflix.to", type: "movie" },
  { name: "MyFlixer", domain: "myflixer.to", type: "movie" },
  { name: "CineZone", domain: "cinezone.to", type: "movie" },
  { name: "WatchOMovies", domain: "watchomovies.com", type: "movie" },
  { name: "Goojara", domain: "goojara.to", type: "movie" },
  { name: "Vumoo", domain: "vumoo.to", type: "movie" },
  { name: "PrimeWire", domain: "primewire.tf", type: "movie" },
  { name: "AZMovies", domain: "azmovies.net", type: "movie" },
  { name: "WatchSeries", domain: "watchseries.id", type: "tvshow" },
  {
    name: "StreamingCommunity",
    domain: "streamingcommunity.photos",
    type: "movie",
  },
  // Free streaming sites - Anime
  { name: "9anime", domain: "9animetv.to", type: "anime" },
  { name: "GogoAnime", domain: "gogoanime.by", type: "anime" },
  { name: "Zoro", domain: "www.zoroto.se", type: "anime" },
  { name: "Animixplay", domain: "animixplay.to", type: "anime" },
  { name: "Animepahe", domain: "animepahe.com", type: "anime" },
  { name: "AnimeKai", domain: "animekai.to", type: "anime" },
  { name: "AniWave", domain: "aniwave.to", type: "anime" },
  { name: "AniWatch", domain: "aniwatch.to", type: "anime" },
  { name: "AllAnimeG", domain: "allanimeg.to", type: "anime" },
  { name: "AniZone", domain: "anizone.to", type: "anime" },
  { name: "AnimeSuge", domain: "animesuge.to", type: "anime" },
  { name: "Anix", domain: "anix.to", type: "anime" },
  { name: "HiAnime", domain: "hianime.to", type: "anime" },
  { name: "Kaido", domain: "kaido.to", type: "anime" },
  { name: "AnimeOnsen", domain: "animeonsen.xyz", type: "anime" },
  { name: "AnimeOwl", domain: "animeowl.live", type: "anime" },
  { name: "AnimeFox", domain: "animefox.tv", type: "anime" },
  { name: "AnimeDao", domain: "animedao.to", type: "anime" },
  { name: "AnimeFLV", domain: "animeflv.net", type: "anime" },
  { name: "AniCrush", domain: "anicrush.to", type: "anime" },
  { name: "YugenAnime", domain: "yugenanime.ro", type: "anime" },
  { name: "KickAssAnime", domain: "kickassanime.am", type: "anime" },
  { name: "AnimeFire", domain: "animefire.plus", type: "anime" },
  { name: "AnimeFenix", domain: "animefenix.tv", type: "anime" },
  { name: "AnimeKisa", domain: "animekisa.in", type: "anime" },
  { name: "BetterAnime", domain: "betteranime.net", type: "anime" },
  { name: "Bilibili", domain: "bilibili.tv", type: "anime" },
  { name: "MonosChinos", domain: "monoschinos.net", type: "anime" },
  { name: "NekoSama", domain: "neko-sama.fr", type: "anime" },
  { name: "OtakuDesu", domain: "otakudesu.cloud", type: "anime" },
  { name: "TioAnime", domain: "tioanime.com", type: "anime" },
  { name: "WCOFun", domain: "wcofun.cc", type: "anime" },
  { name: "JKAnime", domain: "jkanime.net", type: "anime" },
  // Drama & Asian content
  { name: "KissKH", domain: "kisskh.id", type: "tvshow" },
  { name: "Dramahood", domain: "dramahood.mom", type: "tvshow" },
  { name: "GoPlay", domain: "goplay.ml", type: "tvshow" },
  { name: "DramaCool", domain: "dramacool.net.lc", type: "tvshow" },
  { name: "KissAsian", domain: "kissasian.li", type: "tvshow" },
  { name: "AsianLoad", domain: "asianload.cc", type: "tvshow" },
  // Donghua
  { name: "DonghuaStream", domain: "donghuastream.com", type: "anime" },
  { name: "LuciferDonghua", domain: "luciferdonghua.in", type: "anime" },
  { name: "AnimeKhor", domain: "animekhor.xyz", type: "anime" },
  { name: "iQIYI", domain: "iq.com", type: "anime" },
  { name: "Youku", domain: "youku.tv", type: "anime" },
  // Manga & Comics
  { name: "Webtoon", domain: "webtoons.com", type: "manga" },
  { name: "Tapas", domain: "tapas.io", type: "manga" },
  { name: "Comick", domain: "comick.dev", type: "manga" },
  { name: "Mangakakalot", domain: "mangakakalot.to", type: "manga" },
  { name: "Bato", domain: "bato.si", type: "manga" },
  { name: "ReadComicOnline", domain: "readcomiconline.li", type: "manga" },
  { name: "WeebCentral", domain: "weebcentral.com", type: "manga" },
  { name: "ComixTo", domain: "comix.to", type: "manga" },
  { name: "MangaHere", domain: "mangahere.cc", type: "manga" },
  { name: "MangaPark", domain: "mangapark.net", type: "manga" },
  { name: "MangaReader", domain: "mangareader.to", type: "manga" },
  { name: "MangaBuddy", domain: "mangabuddy.com", type: "manga" },
  { name: "MangaClash", domain: "mangaclash.com", type: "manga" },
  { name: "MangaFire", domain: "mangafire.to", type: "manga" },
  { name: "MangaGo", domain: "mangago.me", type: "manga" },
  { name: "MangaHub", domain: "mangahub.io", type: "manga" },
  { name: "MangaLife", domain: "mangalife.us", type: "manga" },
  { name: "Manganato", domain: "manganato.com", type: "manga" },
  { name: "MangaOwl", domain: "mangaowl.to", type: "manga" },
  { name: "MangaPill", domain: "mangapill.com", type: "manga" },
  { name: "TCBScans", domain: "tcbscans.me", type: "manga" },
  { name: "Toonily", domain: "toonily.com", type: "manga" },
  { name: "Toonkor", domain: "toonkor.se", type: "manga" },
  { name: "ReaperScans", domain: "reaperscans.com", type: "manga" },
  { name: "AsuraScans", domain: "asurascans.com", type: "manga" },
  { name: "FlameComics", domain: "flamecomics.com", type: "manga" },
  { name: "LuminousScans", domain: "luminousscans.net", type: "manga" },
  // Novels & Light Novels
  { name: "NovelUpdates", domain: "novelupdates.com", type: "book" },
  { name: "WuxiaWorld", domain: "wuxiaworld.com", type: "book" },
  { name: "RoyalRoad", domain: "royalroad.com", type: "book" },
  { name: "WebNovel", domain: "webnovel.com", type: "book" },
  { name: "LightNovelCave", domain: "lightnovelcave.com", type: "book" },
  { name: "ReadLightNovel", domain: "readlightnovel.me", type: "book" },
  { name: "NovelFull", domain: "novelfull.com", type: "book" },
  { name: "NovelBin", domain: "novelbin.com", type: "book" },
  { name: "ScribbleHub", domain: "scribblehub.com", type: "book" },
  { name: "FreeWebNovel", domain: "freewebnovel.com", type: "book" },
  { name: "MTLNovel", domain: "mtlnovel.com", type: "book" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    addToast,
    trackingEnabled: globalTrackingEnabled,
    setTrackingEnabled: setGlobalTrackingEnabled,
    verychatUser,
    authMethod,
    currentAccount,
  } = useAppStore();
  const [trackingEnabled, setTrackingEnabled] = useState(globalTrackingEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [customSites, setCustomSites] = useState<CustomSite[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteType, setNewSiteType] = useState("movie");
  const [permissionStatus, setPermissionStatus] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);

  // Filter platforms based on search query
  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) return defaultPlatforms;

    const query = searchQuery.toLowerCase().trim();
    return defaultPlatforms.filter(
      (platform) =>
        platform.name.toLowerCase().includes(query) ||
        platform.domain.toLowerCase().includes(query) ||
        platform.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Sync local state with global state
  useEffect(() => {
    setTrackingEnabled(globalTrackingEnabled);
  }, [globalTrackingEnabled]);

  // Load settings from storage
  useEffect(() => {
    if (isExtension) {
      chrome.storage.local.get(
        ["notificationsEnabled", "customSites"],
        (result) => {
          setNotificationsEnabled(result.notificationsEnabled ?? true);
          setCustomSites(result.customSites ?? []);
        }
      );
    }
  }, []);

  // Save settings
  const saveSettings = (key: string, value: any) => {
    if (isExtension) {
      chrome.storage.local.set({ [key]: value });
    }
  };

  // Handle tracking toggle - update both global state and chrome storage
  const handleTrackingToggle = (enabled: boolean) => {
    setTrackingEnabled(enabled);
    setGlobalTrackingEnabled(enabled);
    saveSettings("trackingEnabled", enabled);
  };

  // Request permission for a site
  const requestPermission = async (domain: string) => {
    if (!isExtension) {
      // In web mode, just simulate permission granted for testing
      setPermissionStatus((prev) => ({ ...prev, [domain]: true }));
      addToast({
        type: "success",
        message: `Permission granted for ${domain}`,
      });
      return;
    }

    try {
      const granted = await chrome.permissions.request({
        origins: [`https://*.${domain}/*`],
      });

      if (granted) {
        setPermissionStatus((prev) => ({ ...prev, [domain]: true }));
        addToast({
          type: "success",
          message: `Permission granted for ${domain}`,
        });
      } else {
        addToast({ type: "error", message: `Permission denied for ${domain}` });
      }
    } catch (error) {
      console.error("Permission request failed:", error);
      addToast({ type: "error", message: "Failed to request permission" });
    }
  };

  // Revoke permission for a site
  const revokePermission = async (domain: string) => {
    if (!isExtension) {
      // In web mode, just simulate permission revoked
      setPermissionStatus((prev) => ({ ...prev, [domain]: false }));
      addToast({
        type: "info",
        message: `Tracking disabled for ${domain}`,
      });
      return;
    }

    try {
      // Try to remove the permission
      const removed = await chrome.permissions.remove({
        origins: [`https://*.${domain}/*`],
      });

      if (removed) {
        setPermissionStatus((prev) => ({ ...prev, [domain]: false }));
        addToast({
          type: "info",
          message: `Tracking disabled for ${domain}`,
        });
      } else {
        // Permission might be required (not optional)
        // Just update the UI state to show as disabled
        setPermissionStatus((prev) => ({ ...prev, [domain]: false }));
        addToast({
          type: "info",
          message: `Tracking disabled for ${domain}`,
        });
      }
    } catch (error) {
      console.error("Permission revoke failed:", error);
      // Even if revoke fails, update UI state
      setPermissionStatus((prev) => ({ ...prev, [domain]: false }));
      addToast({
        type: "info",
        message: `Tracking disabled for ${domain}`,
      });
    }
  };

  // Check existing permissions
  useEffect(() => {
    if (isExtension) {
      chrome.permissions.getAll((permissions) => {
        const status: Record<string, boolean> = {};
        const origins = permissions.origins || [];

        defaultPlatforms.forEach((platform) => {
          status[platform.domain] = origins.some((o) =>
            o.includes(platform.domain)
          );
        });

        customSites.forEach((site) => {
          const domain = new URL(site.url).hostname;
          status[domain] = origins.some((o) => o.includes(domain));
        });

        setPermissionStatus(status);
      });
    }
  }, [customSites]);

  // Add custom site
  const addCustomSite = () => {
    if (!newSiteUrl || !newSiteName) {
      addToast({ type: "error", message: "Please fill in all fields" });
      return;
    }

    try {
      const url = new URL(
        newSiteUrl.startsWith("http") ? newSiteUrl : `https://${newSiteUrl}`
      );

      let updated: CustomSite[];

      if (editingSite) {
        // Update existing site
        updated = customSites.map((site) =>
          site.id === editingSite
            ? { ...site, url: url.origin, name: newSiteName, type: newSiteType }
            : site
        );
        addToast({
          type: "success",
          message: `Updated ${newSiteName}`,
        });
      } else {
        // Add new site
        const newSite: CustomSite = {
          id: `custom-${Date.now()}`,
          url: url.origin,
          name: newSiteName,
          type: newSiteType,
          enabled: true,
        };

        updated = [...customSites, newSite];

        // Request permission for the new site
        requestPermission(url.hostname);

        addToast({
          type: "success",
          message: `Added ${newSiteName} to tracking list`,
        });
      }

      setCustomSites(updated);
      saveSettings("customSites", updated);

      setShowAddModal(false);
      setNewSiteUrl("");
      setNewSiteName("");
      setNewSiteType("movie");
      setEditingSite(null);
    } catch {
      addToast({ type: "error", message: "Invalid URL format" });
    }
  };

  // Remove custom site
  const removeCustomSite = (id: string) => {
    setSiteToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (siteToDelete) {
      const updated = customSites.filter((site) => site.id !== siteToDelete);
      setCustomSites(updated);
      saveSettings("customSites", updated);
      addToast({ type: "info", message: "Site removed from tracking list" });
      setSiteToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const editCustomSite = (site: CustomSite) => {
    setEditingSite(site.id);
    setNewSiteName(site.name);
    setNewSiteUrl(site.url);
    setNewSiteType(site.type);
    setShowAddModal(true);
  };

  // Toggle site enabled
  const toggleSite = (id: string) => {
    const updated = customSites.map((site) =>
      site.id === id ? { ...site, enabled: !site.enabled } : site
    );
    setCustomSites(updated);
    saveSettings("customSites", updated);
  };

  // Export VeryChat wallet private key
  const handleExportWallet = async () => {
    if (!verychatUser) {
      addToast({
        type: "error",
        message: "Only VeryChat users can export wallet",
      });
      return;
    }

    // Try to get the local wallet
    const privateKey = exportPrivateKey(verychatUser.profileId);

    if (privateKey) {
      setExportedKey(privateKey);
      setShowPrivateKey(true);

      // Generate QR code
      try {
        const qrUrl = await QRCode.toDataURL(privateKey, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("QR code generation error:", error);
      }

      addToast({
        type: "success",
        message: "Private key exported successfully",
      });
    } else {
      // No local wallet found - user might be on a different device
      addToast({
        type: "error",
        message:
          "No wallet found on this device. Private keys are stored locally for security and cannot be retrieved from the cloud. If you're on a new device, you'll need to either import your existing private key or use the new wallet address created on this device.",
        duration: 8000,
      });
    }
  };

  // Copy private key to clipboard
  const copyPrivateKey = () => {
    if (exportedKey) {
      navigator.clipboard.writeText(exportedKey);
      addToast({
        type: "success",
        message: "Private key copied to clipboard",
      });
    }
  };

  // View recovery phrase (12-word mnemonic)
  const handleViewRecoveryPhrase = () => {
    if (!verychatUser) {
      addToast({
        type: "error",
        message: "Only VeryChat users can view recovery phrase",
      });
      return;
    }

    const phrase = exportRecoveryPhrase(verychatUser.profileId);
    if (phrase) {
      setRecoveryPhrase(phrase);
      setShowBackupModal(true);
      addToast({
        type: "success",
        message: "Recovery phrase loaded",
      });
    } else {
      addToast({
        type: "error",
        message:
          "No recovery phrase found. Your wallet may have been created from a private key without a mnemonic.",
        duration: 6000,
      });
    }
  };

  // Download private key as file
  const downloadPrivateKey = () => {
    if (exportedKey) {
      const blob = new Blob([exportedKey], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veterex-wallet-${verychatUser?.profileId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({
        type: "success",
        message: "Private key downloaded",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-dark border-b border-dark-700/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-300" />
          </button>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
        {/* Preferences Summary */}
        <section className="card p-4 bg-gradient-to-br from-violet/10 to-coral/10 border-violet/20">
          <h3 className="text-sm font-semibold text-white mb-2">Preferences</h3>
          <p className="text-xs text-dark-300">
            {authMethod === "verychat" && verychatUser ? (
              <>Tracking, notifications, wallet security, custom sites</>
            ) : (
              <>Tracking, notifications, custom sites</>
            )}
          </p>
        </section>

        {/* Tracking Settings */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
            Tracking
          </h2>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="font-medium text-white">Enable Tracking</p>
                  <p className="text-xs text-dark-400">
                    Track media on supported websites
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTrackingToggle(!trackingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  trackingEnabled ? "bg-coral" : "bg-dark-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    trackingEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-violet" />
                </div>
                <div>
                  <p className="font-medium text-white">Notifications</p>
                  <p className="text-xs text-dark-400">
                    Get notified when completing media
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  saveSettings("notificationsEnabled", !notificationsEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationsEnabled ? "bg-coral" : "bg-dark-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Wallet Security - Only for VeryChat users */}
        {authMethod === "verychat" && verychatUser && (
          <section>
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
              Wallet Security
            </h2>
            <div className="card space-y-4">
              {/* Recovery Phrase Section */}
              <div className="flex items-start gap-3 pb-4 border-b border-dark-700">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    View Recovery Phrase
                  </p>
                  <p className="text-xs text-dark-400 mb-3">
                    Your 12-word recovery phrase is the master key to your
                    wallet. Write it down and store it safely offline. This is
                    the recommended way to backup your wallet.
                  </p>
                  <button
                    onClick={handleViewRecoveryPhrase}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Recovery Phrase
                  </button>
                </div>
              </div>

              {/* Private Key Export Section */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    Export Wallet Private Key
                  </p>
                  <p className="text-xs text-dark-400 mb-3">
                    Export your wallet private key to import into MetaMask,
                    Trust Wallet, or any EVM-compatible wallet.
                    {isWalletEncrypted(verychatUser.profileId) && (
                      <span className="block mt-1 text-green-400">
                        ✓ Your private key is encrypted with AES-256
                      </span>
                    )}
                  </p>

                  {!exportedKey ? (
                    <button
                      onClick={handleExportWallet}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Export Private Key
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-400">
                            <strong>Warning:</strong> Never share your private
                            key with anyone! Anyone with your private key has
                            full access to your wallet.
                          </p>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-dark-300">
                              Private Key
                            </span>
                            <button
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                              className="text-xs text-dark-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                              {showPrivateKey ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Show
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-xs text-white bg-dark-800 p-2 rounded break-all">
                            {showPrivateKey ? exportedKey : "•".repeat(66)}
                          </div>
                        </div>
                      </div>

                      {/* QR Code for easy mobile scanning */}
                      {qrCodeUrl && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Smartphone className="w-4 h-4 text-purple-400" />
                              <p className="text-sm font-medium text-purple-400">
                                Scan with Mobile Wallet
                              </p>
                            </div>
                            <img
                              src={qrCodeUrl}
                              alt="Private Key QR Code"
                              className="w-40 h-40 rounded-lg bg-white p-2 shadow-lg"
                            />
                            <p className="text-xs text-center text-dark-300 max-w-xs">
                              Scan this QR code with Trust Wallet, MetaMask
                              Mobile, or any wallet app to import your private
                              key.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={copyPrivateKey}
                          className="flex-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={downloadPrivateKey}
                          className="flex-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            setExportedKey(null);
                            setShowPrivateKey(false);
                            setQrCodeUrl(null);
                          }}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-blue-400 mb-2 flex items-center gap-2">
                            <Smartphone className="w-3 h-3" />
                            <strong>Mobile App (Easiest):</strong>
                          </p>
                          <ol className="text-xs text-dark-300 space-y-1 ml-4 list-decimal">
                            <li>Open MetaMask Mobile or Trust Wallet app</li>
                            <li>Tap Menu → "Import Wallet" or "Add Account"</li>
                            <li>Select "Import with private key"</li>
                            <li>Paste private key or scan QR code above</li>
                            <li>
                              Wallet imported! Now add Verychain network below
                            </li>
                          </ol>
                        </div>

                        <div className="border-t border-blue-500/20 pt-2">
                          <p className="text-xs text-blue-400 mb-2">
                            <strong>Desktop/Browser Extension:</strong>
                          </p>
                          <ol className="text-xs text-dark-300 space-y-1 ml-4 list-decimal">
                            <li>
                              Open MetaMask → Click account icon → Import
                              Account
                            </li>
                            <li>Select "Private Key" as import type</li>
                            <li>Paste your private key and click "Import"</li>
                          </ol>
                        </div>

                        <div className="border-t border-blue-500/20 pt-2">
                          <p className="text-xs text-blue-400 mb-2">
                            <strong>Add Verychain Network:</strong>
                          </p>
                          <ul className="text-xs text-dark-300 space-y-1 ml-4 list-disc">
                            <li>
                              Network Name:{" "}
                              <span className="text-white">Verychain</span>
                            </li>
                            <li>
                              RPC URL:{" "}
                              <span className="text-white font-mono">
                                https://rpc.verylabs.io
                              </span>
                            </li>
                            <li>
                              Chain ID: <span className="text-white">4613</span>
                            </li>
                            <li>
                              Currency: <span className="text-white">VERY</span>
                            </li>
                            <li>
                              Explorer:{" "}
                              <span className="text-white font-mono">
                                https://veryscan.io
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Custom Websites - Show first */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">
              Custom Websites
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-sm text-coral hover:text-coral-light"
            >
              <Plus className="w-4 h-4" />
              <span>Add Site</span>
            </motion.button>
          </div>

          {customSites.length > 0 ? (
            <div className="card space-y-3">
              {customSites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-coral transition-colors"
                      title={`Visit ${site.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {site.name}
                      </p>
                      <p className="text-xs text-dark-500">{site.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {site.enabled ? (
                      <div className="group relative">
                        <button
                          onClick={() => toggleSite(site.id)}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-red-400 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Enabled
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-dark-700 border border-dark-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                          Click to disable
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <button
                          onClick={() => toggleSite(site.id)}
                          className="text-xs text-coral hover:text-coral-light"
                        >
                          Enable
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-dark-700 border border-dark-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                          Click to enable
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => editCustomSite(site)}
                      className="p-2 text-dark-400 hover:text-coral transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeCustomSite(site.id)}
                      className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-6">
              <Globe className="w-10 h-10 mx-auto text-dark-600 mb-2" />
              <p className="text-dark-400 text-sm">No custom websites added</p>
              <p className="text-dark-500 text-xs mt-1">
                Add websites you want to track
              </p>
            </div>
          )}
        </section>

        {/* Supported Platforms */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
            Supported Platforms ({filteredPlatforms.length} of{" "}
            {defaultPlatforms.length})
          </h2>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, or domain..."
              className="w-full pl-10 pr-10 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white 
                       placeholder:text-dark-500 focus:outline-none focus:border-coral/50
                       transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="card space-y-3 max-h-[400px] overflow-y-auto">
            {filteredPlatforms.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400 text-sm">No platforms found</p>
                <p className="text-dark-500 text-xs mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredPlatforms.map((platform) => (
                <div
                  key={platform.domain}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://${platform.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-coral transition-colors"
                      title={`Visit ${platform.name}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {platform.name}
                      </p>
                      <p className="text-xs text-dark-500 capitalize">
                        {platform.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {permissionStatus[platform.domain] ? (
                      <div className="group relative">
                        <button
                          onClick={() => revokePermission(platform.domain)}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-red-400 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Enabled
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-dark-700 border border-dark-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                          Click to disable
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestPermission(platform.domain)}
                        className="text-xs text-coral hover:text-coral-light"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium">
              How tracking works
            </p>
            <p className="text-xs text-blue-400/80 mt-1">
              VeTerex tracks your media consumption by detecting when you visit
              supported websites. When you complete watching/reading content,
              you'll be prompted to mint an NFT as proof of your achievement.
            </p>
          </div>
        </div>
      </div>

      {/* Add Site Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
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
                      {editingSite
                        ? "Edit Custom Website"
                        : "Add Custom Website"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingSite(null);
                        setNewSiteName("");
                        setNewSiteUrl("");
                        setNewSiteType("movie");
                      }}
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
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        placeholder="e.g., HBO Max"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Website URL
                      </label>
                      <input
                        type="text"
                        value={newSiteUrl}
                        onChange={(e) => setNewSiteUrl(e.target.value)}
                        placeholder="e.g., hbomax.com"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Media Type
                      </label>
                      <CustomDropdown
                        value={newSiteType}
                        onChange={setNewSiteType}
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
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingSite(null);
                        setNewSiteName("");
                        setNewSiteUrl("");
                        setNewSiteType("movie");
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-dark-700 text-dark-300 font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addCustomSite}
                      className="flex-1 py-2.5 rounded-xl bg-coral text-white font-medium"
                    >
                      {editingSite ? "Update Site" : "Add Site"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm"
              >
                <div className="bg-dark-900 rounded-2xl border border-dark-700 p-6 shadow-xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white text-center mb-2">
                    Delete Custom Website?
                  </h3>
                  <p className="text-sm text-dark-400 text-center mb-6">
                    This action cannot be undone. The website will be removed
                    from your tracking list.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-dark-700 text-dark-300 font-medium hover:bg-dark-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDelete}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Wallet Backup Modal */}
      {recoveryPhrase && currentAccount && (
        <WalletBackupModal
          isOpen={showBackupModal}
          onClose={() => {
            setShowBackupModal(false);
            setRecoveryPhrase(null);
          }}
          recoveryPhrase={recoveryPhrase}
          walletAddress={currentAccount.address}
          isFirstTimeSetup={false}
        />
      )}
    </div>
  );
}
