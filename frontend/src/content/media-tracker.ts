/**
 * VeTerex Media Tracker Content Script
 * Tracks media consumption across supported platforms
 */

// Supported platforms for tracking
const SUPPORTED_PLATFORMS = {
  // Video streaming
  netflix: {
    patterns: ["netflix.com"],
    type: "tvshow",
    selectors: {
      title: '[data-uia="video-title"]',
      progress: ".watch-video--progress-bar",
    },
  },
  youtube: {
    patterns: ["youtube.com/watch", "youtube.com/shorts"],
    type: "video",
    selectors: {
      // Multiple possible title selectors for different YouTube layouts
      title:
        "h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer yt-formatted-string, #title h1, .ytp-title-link",
      progress: ".ytp-progress-bar",
    },
  },
  primevideo: {
    patterns: ["primevideo.com", "amazon.com/gp/video"],
    type: "movie",
    selectors: {
      title: '[data-automation-id="title"]',
      progress: ".atvwebplayersdk-progress-bar",
    },
  },
  disneyplus: {
    patterns: ["disneyplus.com"],
    type: "movie",
    selectors: {
      title: '[data-testid="title"]',
      progress: ".progress-bar",
    },
  },
  hulu: {
    patterns: ["hulu.com/watch"],
    type: "tvshow",
    selectors: {
      title: ".metadata__title",
      progress: ".progress-bar",
    },
  },
  crunchyroll: {
    patterns: ["crunchyroll.com/watch"],
    type: "anime",
    selectors: {
      title: '[data-testid="vilos-title"]',
      progress: ".vjs-progress-holder",
    },
  },
  // Reading platforms
  goodreads: {
    patterns: ["goodreads.com/book"],
    type: "book",
    selectors: {
      title: "#bookTitle",
      author: ".authorName",
      progress: ".progress",
    },
  },
  kindle: {
    patterns: ["read.amazon.com"],
    type: "book",
    selectors: {
      title: "#book-title",
      progress: "#kindleReader_progress",
    },
  },
  mangadex: {
    patterns: ["mangadex.org/chapter"],
    type: "manga",
    selectors: {
      title: ".manga-title",
      progress: ".chapter-progress",
    },
  },
  // Anime tracking sites
  myanimelist: {
    patterns: ["myanimelist.net/anime"],
    type: "anime",
    selectors: {
      title: ".title-name",
      episodes: ".di-ib",
    },
  },
  anilist: {
    patterns: ["anilist.co/anime"],
    type: "anime",
    selectors: {
      title: ".content h1",
      episodes: ".data-set",
    },
  },
};

interface MediaInfo {
  platform: string;
  type: string;
  title: string;
  url: string;
  progress?: number;
  duration?: number;
  thumbnail?: string;
  timestamp: number;
}

interface TrackingSession {
  mediaInfo: MediaInfo;
  startTime: number;
  lastUpdate: number;
  watchTime: number;
  completed: boolean;
}

// Current tracking session
let currentSession: TrackingSession | null = null;
let trackingInterval: ReturnType<typeof setInterval> | null = null;
let customSites: Array<{
  id?: string;
  url: string;
  name: string;
  type: string;
  enabled?: boolean;
}> = [];

// Load custom sites from storage
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.local.get(["customSites"], (result) => {
    customSites = result.customSites || [];
    console.log("[VeTerex] Loaded custom sites:", customSites);
  });

  // Listen for custom sites updates
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.customSites) {
      customSites = changes.customSites.newValue || [];
      console.log("[VeTerex] Updated custom sites:", customSites);
    }
  });
}

/**
 * Extract domain from URL string
 */
function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace("www.", "");
  } catch {
    return urlString
      .replace(/https?:\/\//, "")
      .replace("www.", "")
      .split("/")[0];
  }
}

/**
 * Detect which platform the user is currently on
 */
function detectPlatform(): {
  name: string;
  config: (typeof SUPPORTED_PLATFORMS)[keyof typeof SUPPORTED_PLATFORMS];
} | null {
  const url = window.location.href;
  const hostname = window.location.hostname.replace("www.", "");

  // Check built-in supported platforms first
  for (const [name, config] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (config.patterns.some((pattern) => url.includes(pattern))) {
      return { name, config };
    }
  }

  // Check custom sites
  for (const site of customSites) {
    if (!site.enabled && site.enabled !== undefined) continue; // Skip disabled sites

    const siteDomain = extractDomain(site.url);
    if (hostname.includes(siteDomain) || siteDomain.includes(hostname)) {
      console.log("[VeTerex] Matched custom site:", site.name, siteDomain);
      return {
        name: site.name || hostname,
        config: {
          patterns: [siteDomain],
          type: site.type || "video",
          selectors: {
            title: "h1, .title, [class*='title'], title",
            progress: ".progress-bar, [class*='progress']",
          },
        },
      };
    }
  }

  // Check if there's a video element on the page (generic fallback)
  const video = document.querySelector("video");
  if (video && video.duration > 0) {
    return {
      name: hostname,
      config: {
        patterns: [hostname],
        type: "video",
        selectors: {
          title: "h1, .title, [class*='title'], title",
          progress: ".progress-bar, [class*='progress']",
        },
      },
    };
  }

  return null;
}

/**
 * Extract media information from the current page
 */
function extractMediaInfo(): MediaInfo | null {
  const platform = detectPlatform();
  if (!platform) return null;

  const { name, config } = platform;

  try {
    let title = "Unknown Title";
    let progress = 0;
    let duration = 0;
    let thumbnail = "";

    // Try to get thumbnail from og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      thumbnail = ogImage.getAttribute("content") || "";
    }

    // Special handling for YouTube
    if (name === "youtube") {
      // Try multiple selectors for YouTube title
      const titleSelectors = [
        "h1.ytd-watch-metadata yt-formatted-string",
        "h1.ytd-video-primary-info-renderer yt-formatted-string",
        "#title h1 yt-formatted-string",
        ".ytp-title-link",
        "ytd-watch-metadata h1",
        "#container h1.title",
        // For shorts
        "ytd-reel-video-renderer h2.title",
        ".reel-video-in-sequence ytd-reel-player-header-renderer h2",
      ];

      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          break;
        }
      }

      // Get video progress
      const video = document.querySelector("video");
      if (video && video.duration && !isNaN(video.duration)) {
        duration = video.duration;
        progress = (video.currentTime / video.duration) * 100;
      }
    } else {
      // Generic extraction for other platforms
      // Try multiple title selectors
      const titleSelectors = config.selectors.title
        .split(",")
        .map((s) => s.trim());
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement?.textContent?.trim()) {
          title = titleElement.textContent.trim();
          break;
        }
      }

      // Fallback: try document title
      if (title === "Unknown Title" && document.title) {
        // Clean up the title (remove site name suffixes)
        title = document.title.split("|")[0].split("-")[0].split("—")[0].trim();
      }

      // Try to get progress from progress bar
      const selectors = config.selectors as { progress?: string };
      if (selectors.progress) {
        const progressSelectors = selectors.progress
          .split(",")
          .map((s) => s.trim());
        for (const selector of progressSelectors) {
          const progressElement = document.querySelector(
            selector
          ) as HTMLElement;
          if (progressElement) {
            const style = progressElement.getAttribute("style");
            if (style) {
              const match = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
              if (match) {
                progress = parseFloat(match[1]);
                break;
              }
            }
          }
        }
      }

      // For video elements on any platform - this is the most reliable
      const video = document.querySelector("video");
      if (
        video &&
        video.duration &&
        !isNaN(video.duration) &&
        video.duration > 0
      ) {
        duration = video.duration;
        progress = (video.currentTime / video.duration) * 100;
        console.log("[VeTerex] Video found:", {
          duration: video.duration,
          currentTime: video.currentTime,
          progress,
        });
      }
    }

    // If we still don't have a title, try using the page title
    if (title === "Unknown Title" && document.title) {
      title = document.title.split("|")[0].split("-")[0].trim();
    }

    // Don't track if we couldn't find a title
    if (title === "Unknown Title" || !title) {
      console.log("[VeTerex] Could not extract title, skipping");
      return null;
    }

    console.log("[VeTerex] Extracted media info:", {
      platform: name,
      title,
      progress,
      duration,
    });

    return {
      platform: name,
      type: config.type,
      title,
      url: window.location.href,
      progress,
      duration,
      thumbnail,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[VeTerex] Failed to extract media info:", error);
    return null;
  }
}

/**
 * Start tracking media consumption
 */
function startTracking() {
  const mediaInfo = extractMediaInfo();
  if (!mediaInfo) {
    console.log("[VeTerex] Could not extract media info, retrying...");
    // Retry after a short delay - YouTube might not have loaded content yet
    setTimeout(() => {
      const retryInfo = extractMediaInfo();
      if (retryInfo && !currentSession) {
        initSession(retryInfo);
      }
    }, 2000);
    return;
  }

  initSession(mediaInfo);
}

/**
 * Initialize a tracking session
 */
function initSession(mediaInfo: MediaInfo) {
  console.log("[VeTerex] Starting media tracking:", mediaInfo);

  // Generate a unique ID for this tracking session
  const sessionId = `${mediaInfo.platform}-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  currentSession = {
    mediaInfo: {
      ...mediaInfo,
      id: sessionId,
    } as MediaInfo & { id: string },
    startTime: Date.now(),
    lastUpdate: Date.now(),
    watchTime: 0,
    completed: false,
  };

  // Send tracking start message to background
  chrome.runtime.sendMessage({
    type: "TRACKING_START",
    data: {
      id: sessionId,
      ...currentSession.mediaInfo,
      startTime: currentSession.startTime,
      watchTime: 0,
      completed: false,
    },
  });

  // Update tracking every 5 seconds for more responsive UI
  trackingInterval = setInterval(updateTracking, 5000);
}

/**
 * Update tracking progress
 */
function updateTracking() {
  if (!currentSession) return;

  const mediaInfo = extractMediaInfo();
  if (!mediaInfo) return;

  const now = Date.now();
  currentSession.lastUpdate = now;
  currentSession.mediaInfo.progress = mediaInfo.progress;
  currentSession.mediaInfo.duration = mediaInfo.duration;

  // Get actual watch time from video element if available
  const video = document.querySelector("video");
  if (video && !isNaN(video.currentTime)) {
    // Use the actual video currentTime as watch time
    currentSession.watchTime = video.currentTime;
  } else {
    // Fallback: calculate based on progress and duration
    if (mediaInfo.duration && mediaInfo.progress) {
      currentSession.watchTime =
        (mediaInfo.progress / 100) * mediaInfo.duration;
    }
  }

  // Get the session ID
  const sessionData = currentSession.mediaInfo as MediaInfo & { id?: string };
  const sessionId =
    sessionData.id ||
    `${currentSession.mediaInfo.platform}-${currentSession.startTime}`;

  // Check if completed (>90% progress or near end of video)
  const progress = mediaInfo.progress ?? 0;
  const isNearEnd =
    mediaInfo.duration && mediaInfo.duration > 0
      ? progress >= 90 ||
        mediaInfo.duration - (progress / 100) * mediaInfo.duration < 30
      : progress >= 90;

  if (isNearEnd && !currentSession.completed) {
    currentSession.completed = true;
    notifyCompletion(currentSession);
  }

  // Send progress update to background
  chrome.runtime.sendMessage({
    type: "TRACKING_UPDATE",
    data: {
      id: sessionId,
      platform: currentSession.mediaInfo.platform,
      type: currentSession.mediaInfo.type,
      title: currentSession.mediaInfo.title,
      url: currentSession.mediaInfo.url,
      progress: currentSession.mediaInfo.progress,
      duration: currentSession.mediaInfo.duration,
      thumbnail:
        mediaInfo.thumbnail || currentSession.mediaInfo.thumbnail || "",
      startTime: currentSession.startTime,
      lastUpdate: now,
      watchTime: Math.round(currentSession.watchTime),
      completed: currentSession.completed,
    },
  });
}

/**
 * Stop tracking
 */
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  if (currentSession) {
    // Final update
    updateTracking();

    // Send tracking end message
    chrome.runtime.sendMessage({
      type: "TRACKING_END",
      data: currentSession,
    });

    currentSession = null;
  }
}

/**
 * Notify user of completion
 */
function notifyCompletion(session: TrackingSession) {
  console.log("[VeTerex] Media completed!", session);

  // Send completion notification
  chrome.runtime.sendMessage({
    type: "MEDIA_COMPLETED",
    data: {
      ...session.mediaInfo,
      watchTime: session.watchTime,
    },
  });

  // Show notification badge
  showCompletionBanner(session.mediaInfo);
}

/**
 * Show a banner to the user offering to mint NFT
 */
function showCompletionBanner(mediaInfo: MediaInfo) {
  // Remove existing banner if any
  const existingBanner = document.getElementById("veterex-completion-banner");
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement("div");
  banner.id = "veterex-completion-banner";
  banner.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
      
      #veterex-completion-banner {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #4a5568;
        border-radius: 16px;
        padding: 20px 24px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 340px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .veterex-banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .veterex-banner-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .veterex-banner-icon svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      .veterex-banner-title {
        color: #00d4ff;
        font-weight: 600;
        font-size: 16px;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-subtitle {
        color: #a0aec0;
        font-size: 12px;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-media {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .veterex-banner-media-title {
        color: white;
        font-weight: 500;
        font-size: 14px;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-media-type {
        color: #a0aec0;
        font-size: 12px;
        text-transform: capitalize;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-buttons {
        display: flex;
        gap: 10px;
      }
      
      .veterex-banner-btn {
        flex: 1;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-btn-primary {
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
        color: white;
      }
      
      .veterex-banner-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
      }
      
      .veterex-banner-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #a0aec0;
      }
      
      .veterex-banner-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .veterex-banner-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: #718096;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .veterex-banner-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    </style>
    
    <button class="veterex-banner-close" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    
    <div class="veterex-banner-header">
      <div class="veterex-banner-icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
      <div>
        <p class="veterex-banner-title">Completion Detected!</p>
        <p class="veterex-banner-subtitle">VeTerex Achievement</p>
      </div>
    </div>
    
    <div class="veterex-banner-media">
      <p class="veterex-banner-media-title">${mediaInfo.title}</p>
      <p class="veterex-banner-media-type">${mediaInfo.type} • ${mediaInfo.platform}</p>
    </div>
    
    <div class="veterex-banner-buttons">
      <button class="veterex-banner-btn veterex-banner-btn-secondary" onclick="this.closest('#veterex-completion-banner').remove()">
        Later
      </button>
      <button class="veterex-banner-btn veterex-banner-btn-primary" id="veterex-mint-btn">
        Mint NFT 🏆
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  // Handle mint button click
  const mintBtn = document.getElementById("veterex-mint-btn");
  if (mintBtn) {
    mintBtn.addEventListener("click", () => {
      // Store completion data and open extension
      chrome.runtime.sendMessage({
        type: "OPEN_MINT_MODAL",
        data: mediaInfo,
      });
      banner.remove();
    });
  }

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.getElementById("veterex-completion-banner")) {
      banner.remove();
    }
  }, 30000);
}

/**
 * Initialize content script
 */
function init() {
  const platform = detectPlatform();
  if (!platform) {
    console.log("[VeTerex] Not a supported platform");
    return;
  }

  console.log("[VeTerex] Content script initialized on:", platform.name);

  // Start tracking when video/content loads
  let initTimeout: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver(() => {
    // Debounce initialization
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
      if (!currentSession) {
        startTracking();
      }
    }, 2000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Stop tracking when page is unloaded
  window.addEventListener("beforeunload", stopTracking);

  // Handle visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopTracking();
    } else if (detectPlatform()) {
      startTracking();
    }
  });

  // Initial check
  setTimeout(() => {
    if (!currentSession) {
      startTracking();
    }
  }, 3000);
}

// Start initialization
init();
