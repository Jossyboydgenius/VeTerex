import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { isExtension } from "@/services/tracking";
import { CustomDropdown } from "@/components/CustomDropdown";

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
  const {
    addToast,
    trackingEnabled: globalTrackingEnabled,
    setTrackingEnabled: setGlobalTrackingEnabled,
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
    } catch (error) {
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
                  <Activity className="w-5 h-5 text-accent-400" />
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
                <div className="flex items-center gap-3">
                  <a
                    href={`https://${platform.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-accent-400 transition-colors"
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
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-accent-400 transition-colors"
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
                          className="text-xs text-accent-400 hover:text-accent-300"
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
                      className="p-2 text-dark-400 hover:text-accent-400 transition-colors"
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
                      className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-medium"
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
    </div>
  );
}
