import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Globe,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { isExtension } from "@/services/tracking";

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
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [customSites, setCustomSites] = useState<CustomSite[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteType, setNewSiteType] = useState("movie");
  const [permissionStatus, setPermissionStatus] = useState<
    Record<string, boolean>
  >({});

  // Load settings from storage
  useEffect(() => {
    if (isExtension) {
      chrome.storage.local.get(
        ["trackingEnabled", "notificationsEnabled", "customSites"],
        (result) => {
          setTrackingEnabled(result.trackingEnabled ?? true);
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

  // Request permission for a site
  const requestPermission = async (domain: string) => {
    if (!isExtension) return;

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
      const newSite: CustomSite = {
        id: `custom-${Date.now()}`,
        url: url.origin,
        name: newSiteName,
        type: newSiteType,
        enabled: true,
      };

      const updated = [...customSites, newSite];
      setCustomSites(updated);
      saveSettings("customSites", updated);

      // Request permission for the new site
      requestPermission(url.hostname);

      setShowAddModal(false);
      setNewSiteUrl("");
      setNewSiteName("");
      setNewSiteType("movie");

      addToast({
        type: "success",
        message: `Added ${newSiteName} to tracking list`,
      });
    } catch (error) {
      addToast({ type: "error", message: "Invalid URL format" });
    }
  };

  // Remove custom site
  const removeCustomSite = (id: string) => {
    const updated = customSites.filter((site) => site.id !== id);
    setCustomSites(updated);
    saveSettings("customSites", updated);
    addToast({ type: "info", message: "Site removed from tracking list" });
  };

  // Toggle site enabled
  const toggleSite = (id: string) => {
    const updated = customSites.map((site) =>
      site.id === id ? { ...site, enabled: !site.enabled } : site
    );
    setCustomSites(updated);
    saveSettings("customSites", updated);
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
        {/* Tracking Settings */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
            Tracking
          </h2>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Enable Tracking</p>
                  <p className="text-xs text-dark-400">
                    Track media on supported websites
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTrackingEnabled(!trackingEnabled);
                  saveSettings("trackingEnabled", !trackingEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  trackingEnabled ? "bg-accent-500" : "bg-dark-600"
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
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-400" />
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
                  notificationsEnabled ? "bg-accent-500" : "bg-dark-600"
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

        {/* Supported Platforms */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
            Supported Platforms
          </h2>
          <div className="card space-y-3">
            {defaultPlatforms.map((platform) => (
              <div
                key={platform.domain}
                className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {platform.name}
                  </p>
                  <p className="text-xs text-dark-500 capitalize">
                    {platform.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {permissionStatus[platform.domain] ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Check className="w-3 h-3" />
                      Enabled
                    </span>
                  ) : (
                    <button
                      onClick={() => requestPermission(platform.domain)}
                      className="text-xs text-accent-400 hover:text-accent-300"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Websites */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">
              Custom Websites
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
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
                    <button
                      onClick={() => toggleSite(site.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        site.enabled
                          ? "bg-accent-500 border-accent-500"
                          : "border-dark-500"
                      }`}
                    >
                      {site.enabled && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {site.name}
                      </p>
                      <p className="text-xs text-dark-500">{site.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCustomSite(site.id)}
                    className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
      {showAddModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 z-50 max-w-md mx-auto"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <div className="glass-dark rounded-2xl border border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Add Custom Website
              </h3>

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
                  <select
                    value={newSiteType}
                    onChange={(e) => setNewSiteType(e.target.value)}
                    className="input-field"
                  >
                    <option value="movie">Movie</option>
                    <option value="tvshow">TV Show</option>
                    <option value="anime">Anime</option>
                    <option value="book">Book</option>
                    <option value="manga">Manga</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-dark-700 text-dark-300 font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addCustomSite}
                  className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-medium"
                >
                  Add Site
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
