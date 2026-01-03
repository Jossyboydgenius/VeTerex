/**
 * VeTerex Media Tracker Content Script
 * Tracks media consumption across supported platforms
 */

// Import UI components from extracted modules
import {
  showTrackSeriesButton as showTrackSeriesButtonUI,
  showCompletionBanner as showCompletionBannerUI,
} from "./ui";

// Supported platforms for tracking
const SUPPORTED_PLATFORMS = {
  // Video streaming - Premium
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
  // Free streaming - Movies & TV
  hurawatch: {
    patterns: ["hurawatch.tw", "hurawatch.cc"],
    type: "movie",
    selectors: {
      title: ".heading-name, .film-name, h1.title, .dp-i-title",
      progress: ".progress-bar, [class*='progress']",
    },
  },
  filmboom: {
    patterns: ["filmboom.top", "moviebox.ph"],
    type: "movie",
    selectors: {
      title:
        ".title, h1, .movie-title, .video-title, .detail-title, [class*='title']",
      progress: ".progress-bar, [class*='progress']",
    },
    // API endpoint for metadata extraction
    apiPattern: /wefeed-h5-bff\/web\/subject\/detail\?subjectId=(\d+)/,
  },
  moviebox: {
    patterns: ["moviebox.ph"],
    type: "movie",
    selectors: {
      title: ".title, h1, .movie-title",
      progress: ".progress-bar, [class*='progress']",
    },
  },
  fmovies: {
    patterns: ["fmovies.to", "fmovies.wtf", "fmovies.co", "ww4.fmovies.co"],
    type: "movie",
    selectors: {
      title: ".heading-name, h1.name, .film-name",
      progress: ".progress-bar",
    },
  },
  solarmovie: {
    patterns: [
      "solarmovie.pe",
      "solarmovie.to",
      "solarmovie.one",
      "wwv.solarmovie.one",
      "solarmovie.cr",
      "www3.solarmovie.cr",
    ],
    type: "movie",
    selectors: {
      title: ".heading-name, h1",
      progress: ".progress-bar",
    },
  },
  movies123: {
    patterns: ["123movies.ai", "123movies.to"],
    type: "movie",
    selectors: {
      title: ".heading-name, h1",
      progress: ".progress-bar",
    },
  },
  putlocker: {
    patterns: ["putlocker.vip"],
    type: "movie",
    selectors: {
      title: ".heading-name, h1",
      progress: ".progress-bar",
    },
  },
  yesmovies: {
    patterns: ["yesmovies.ag", "yesmovies.to"],
    type: "movie",
    selectors: {
      title: ".heading-name, h1",
      progress: ".progress-bar",
    },
  },
  soap2day: {
    patterns: [
      "soap2day.to",
      "soap2day.rs",
      "soap2day.day",
      "ww25.soap2day.day",
    ],
    type: "tvshow",
    selectors: {
      title: ".heading-name, h1, .film-title",
      progress: ".progress-bar",
    },
  },
  // Free streaming - Anime
  "9anime": {
    patterns: ["9animetv.to", "9anime.to", "9anime.gs"],
    type: "anime",
    selectors: {
      title: ".film-name, h1.title, .anime-title, .dp-i-title",
      progress: ".progress-bar, [class*='progress']",
      episode: ".server-notice b, .episodes .active",
    },
  },
  gogoanime: {
    patterns: ["gogoanime.hu", "gogoanime.gg", "anitaku.to", "gogoanime.by"],
    type: "anime",
    selectors: {
      title: ".anime_video_body_cate a, h1, .video-title",
      progress: ".progress-bar",
    },
  },
  zoro: {
    patterns: ["zoro.to", "aniwatch.to", "zoroto.se", "www.zoroto.se"],
    type: "anime",
    selectors: {
      title: ".film-name, h1.name",
      progress: ".progress-bar",
    },
  },
  animixplay: {
    patterns: ["animixplay.to"],
    type: "anime",
    selectors: {
      title: "#animetitle, .animetitle",
      progress: ".progress-bar",
    },
  },
  animepahe: {
    patterns: ["animepahe.com", "animepahe.ru"],
    type: "anime",
    selectors: {
      title: ".theatre-info h1, .anime-title",
      progress: ".progress-bar",
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
      title: ".manga-title, [data-title], h1",
      progress: ".chapter-progress",
    },
    // MangaDex API pattern for chapter metadata
    apiPattern: /api\.mangadex\.org\/chapter\/([a-f0-9-]+)/,
  },
  webtoon: {
    patterns: ["webtoons.com"],
    type: "manga",
    selectors: {
      title:
        ".subj_episode, .subj, .episode__title, h1.subj_episode, .detail_lst .subj, h1",
      progress: ".progress-bar",
      episode: ".episode-num, .episode_no, [class*='episode']",
    },
  },
  tapas: {
    patterns: ["tapas.io"],
    type: "manga",
    selectors: {
      title: ".title, h1.series-title",
      progress: ".progress-bar",
    },
  },
  comick: {
    patterns: ["comick.io", "comick.fun", "comick.dev"],
    type: "manga",
    selectors: {
      title: "h1, .chapter-title",
      progress: ".progress-bar",
    },
  },
  mangakakalot: {
    patterns: ["mangakakalot.com", "manganato.com", "mangakakalot.to"],
    type: "manga",
    selectors: {
      title: ".chapter-name, h1",
      progress: ".progress-bar",
    },
  },
  mangasee: {
    patterns: ["mangasee123.com", "weebcentral.com"],
    type: "manga",
    selectors: {
      title: ".MainContainer h1, .manga-info h1",
      progress: ".progress-bar",
    },
  },
  bato: {
    patterns: ["bato.to", "bato.si"],
    type: "manga",
    selectors: {
      title: "h3.item-title, .chapter-name",
      progress: ".progress-bar",
    },
  },
  readcomiconline: {
    patterns: ["readcomiconline.li"],
    type: "manga",
    selectors: {
      title: ".bigChar, h1",
      progress: ".progress-bar",
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
  // Drama streaming sites
  kisskh: {
    patterns: ["kisskh.id", "kisskh.me", "kisskh.co"],
    type: "tvshow",
    selectors: {
      title: ".name, h1, .drama-title",
      progress: ".progress-bar, [class*='progress']",
    },
  },
  dramahood: {
    patterns: ["dramahood.mom", "dramahood.se", "dramahood.cc"],
    type: "tvshow",
    selectors: {
      title: ".video-title, h1, .drama-name",
      progress: ".progress-bar",
    },
  },
  goplay: {
    patterns: ["goplay.ml", "goplay.gg"],
    type: "tvshow",
    selectors: {
      title: ".title, h1",
      progress: ".progress-bar",
    },
  },
  dramacool: {
    patterns: ["dramacool.net.lc", "dramacool.sr", "dramacool.cr", "asianc.co"],
    type: "tvshow",
    selectors: {
      title: ".details h1, .info h1, .drama-name",
      progress: ".progress-bar",
    },
  },
  // Additional manga sites
  comixto: {
    patterns: ["comix.to"],
    type: "manga",
    selectors: {
      title: "h1, .comic-title",
      progress: ".progress-bar",
    },
  },
  weebcentral: {
    patterns: ["weebcentral.com"],
    type: "manga",
    selectors: {
      title: "h1, .manga-title",
      progress: ".progress-bar",
    },
  },
  // ========== ANIME STREAMING SITES ==========
  animekai: {
    patterns: ["animekai.to", "animekai.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  aniwave: {
    patterns: ["aniwave.to", "aniwave.cc", "aniwave.se", "aniwave.live"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  aniwatch: {
    patterns: ["aniwatch.to", "aniwatch.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  allanimeg: {
    patterns: ["allanimeg.to", "allanimeg.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  anizone: {
    patterns: ["anizone.to", "anizone.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animesuge: {
    patterns: ["animesuge.to", "animesuge.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  anix: {
    patterns: ["anix.to", "anix.vc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  hianime: {
    patterns: ["hianime.to", "hianime.tv"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  kaido: {
    patterns: ["kaido.to", "kaido.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animeonsen: {
    patterns: ["animeonsen.xyz"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animeowl: {
    patterns: ["animeowl.live", "animeowl.me"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animefox: {
    patterns: ["animefox.tv", "animefox.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animedao: {
    patterns: ["animedao.to", "animedao.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animeflv: {
    patterns: ["animeflv.net", "animeflv.ws"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  anicrush: {
    patterns: ["anicrush.to"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animegg: {
    patterns: ["animegg.org"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animeland: {
    patterns: ["animeland.tv"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animension: {
    patterns: ["animension.to"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animesa: {
    patterns: ["animesa.ga"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animesaturn: {
    patterns: ["animesaturn.cx", "animesaturn.tv"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animetoast: {
    patterns: ["animetoast.cc"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animexin: {
    patterns: ["animexin.vip"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  asianload: {
    patterns: ["asianload.cc", "asianload.io"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  yugenanime: {
    patterns: ["yugenanime.ro", "yugenanime.tv"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  kickassanime: {
    patterns: ["kickassanime.am", "kickassanime.mx"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animefire: {
    patterns: ["animefire.plus", "animefire.net"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animefenix: {
    patterns: ["animefenix.tv"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animekisa: {
    patterns: ["animekisa.in"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animeku: {
    patterns: ["animeku.me"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  betteranime: {
    patterns: ["betteranime.net"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  bilibili: {
    patterns: ["bilibili.tv", "bilibili.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  monoschinos: {
    patterns: ["monoschinos.net", "monoschinos2.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  nanime: {
    patterns: ["nanime.co", "nanime.biz"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  neko_sama: {
    patterns: ["neko-sama.fr"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  otakudesu: {
    patterns: ["otakudesu.cloud", "otakudesu.cam"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  superanimes: {
    patterns: ["superanimes.org"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  tioanime: {
    patterns: ["tioanime.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  wcofun: {
    patterns: ["wcofun.cc", "wcofun.org", "wcoforever.org", "wcoforever.net"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  jkanime: {
    patterns: ["jkanime.net"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  // ========== MANGA/MANHWA/MANHUA SITES ==========
  mangahere: {
    patterns: ["mangahere.cc", "mangahere.us"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangapark: {
    patterns: ["mangapark.net", "mangapark.to"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangareader: {
    patterns: ["mangareader.to", "mangareader.cc"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangabuddy: {
    patterns: ["mangabuddy.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangaclash: {
    patterns: ["mangaclash.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangafire: {
    patterns: ["mangafire.to"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangago: {
    patterns: ["mangago.me"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangahub: {
    patterns: ["mangahub.io"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangairo: {
    patterns: ["mangairo.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangakomi: {
    patterns: ["mangakomi.io"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangalife: {
    patterns: ["mangalife.us", "manga4life.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  manganato: {
    patterns: ["manganato.com", "chapmanganato.to"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangaowl: {
    patterns: ["mangaowl.to"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangapill: {
    patterns: ["mangapill.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangaplex: {
    patterns: ["mangaplex.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangatx: {
    patterns: ["mangatx.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mangaworld: {
    patterns: ["mangaworld.ac"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  tcbscans: {
    patterns: ["tcbscans.me", "tcbscans.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  toonily: {
    patterns: ["toonily.com", "toonily.net"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  toonkor: {
    patterns: ["toonkor.se"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  reaperscans: {
    patterns: ["reaperscans.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  asurascans: {
    patterns: ["asurascans.com", "asuracomic.net"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  flamecomics: {
    patterns: ["flamecomics.com", "flamecomics.me"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  luminousscans: {
    patterns: ["luminousscans.net", "luminousscans.com"],
    type: "manga",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  // ========== DONGHUA SITES ==========
  donghuastream: {
    patterns: ["donghuastream.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  luciferdonghua: {
    patterns: ["luciferdonghua.in"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  myanime: {
    patterns: ["myanime.live"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  animekhor: {
    patterns: ["animekhor.xyz"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  iqiyi: {
    patterns: ["iq.com", "iqiyi.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  youku: {
    patterns: ["youku.tv", "youku.com"],
    type: "anime",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  // ========== NOVEL/LIGHT NOVEL SITES ==========
  novelupdates: {
    patterns: ["novelupdates.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  wuxiaworld: {
    patterns: ["wuxiaworld.com", "wuxiaworld.site"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  royalroad: {
    patterns: ["royalroad.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  webnovel: {
    patterns: ["webnovel.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  lightnovelcave: {
    patterns: ["lightnovelcave.com", "lightnovelworld.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  readlightnovel: {
    patterns: ["readlightnovel.me", "readlightnovel.today"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  novelfull: {
    patterns: ["novelfull.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  novelbin: {
    patterns: ["novelbin.com", "novelbin.me"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  scribblehub: {
    patterns: ["scribblehub.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  freewebnovel: {
    patterns: ["freewebnovel.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  mtlnovel: {
    patterns: ["mtlnovel.com"],
    type: "book",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  // ========== MOVIE/TV STREAMING SITES ==========
  flixhq: {
    patterns: ["flixhq.to", "flixhq.net"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  lookmovie: {
    patterns: ["lookmovie.io", "lookmovie2.to"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  hdtoday: {
    patterns: ["hdtoday.cc", "hdtoday.tv"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  moviesjoy: {
    patterns: ["moviesjoy.to", "moviesjoy.is"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  kissasian: {
    patterns: ["kissasian.li", "kissasian.fan"],
    type: "tvshow",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  dopebox: {
    patterns: ["dopebox.to", "dopebox.se"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  sflix: {
    patterns: ["sflix.to", "sflix.se"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  bflixto: {
    patterns: ["bflix.to", "bflix.gs"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  myflixer: {
    patterns: ["myflixer.to", "myflixer.today"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  cinezone: {
    patterns: ["cinezone.to"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  watchomovies: {
    patterns: ["watchomovies.com"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  goojara: {
    patterns: ["goojara.to", "goojarawatch.com"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  vumoo: {
    patterns: ["vumoo.to", "vumoo.life"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  primewire: {
    patterns: ["primewire.tf", "primewire.li"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  azmovies: {
    patterns: ["azmovies.net"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  watchseries: {
    patterns: ["watchseries.id", "watchserieshd.tv"],
    type: "tvshow",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
  },
  streamingcommunity: {
    patterns: ["streamingcommunity.photos"],
    type: "movie",
    selectors: { title: "h1, .title", progress: ".progress-bar" },
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
  // Additional metadata from API responses
  description?: string;
  genre?: string;
  releaseDate?: string;
  chapter?: string;
  episode?: string;
  // Enhanced tracking fields
  totalPages?: number;
  currentPage?: number;
  totalChapters?: number;
  currentChapter?: number;
  scrollProgress?: number;
}

// Type declaration for Firefox's browser API
declare const browser: typeof chrome | undefined;

// Cross-browser compatibility - use browser API if available (Firefox) or chrome
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// API Response interfaces for different platforms
interface FilmboomApiResponse {
  code: number;
  message: string;
  data: {
    subject: {
      subjectId: string;
      title: string;
      description: string;
      releaseDate: string;
      duration: number;
      genre: string;
      cover: { url: string };
      imdbRatingValue: string;
    };
  };
}

interface MangaDexChapterResponse {
  result: string;
  data: Array<{
    id: string;
    type: string;
    attributes: {
      volume: string;
      chapter: string;
      title: string;
      translatedLanguage: string;
      pages: number;
    };
    relationships: Array<{
      id: string;
      type: string;
    }>;
  }>;
}

interface NineAnimeServerResponse {
  status: boolean;
  html: string;
}

interface TrackingSession {
  mediaInfo: MediaInfo;
  startTime: number;
  lastUpdate: number;
  watchTime: number;
  completed: boolean;
}

// ========== ENHANCED TRACKING STATE ==========
// Current tracking session
let currentSession: TrackingSession | null = null;
let trackingInterval: ReturnType<typeof setInterval> | null = null;
let scrollTrackingInterval: ReturnType<typeof setInterval> | null = null;
let activityTrackingInterval: ReturnType<typeof setInterval> | null = null;
let maxScrollProgress = 0;
let totalActiveTime = 0;
let lastActivityTime = Date.now();
let isUserActive = true;

let customSites: Array<{
  id?: string;
  url: string;
  name: string;
  type: string;
  enabled?: boolean;
}> = [];

// ========== SCROLL/READING PROGRESS TRACKING ==========
/**
 * Calculate scroll progress as a percentage
 */
function getScrollContainer(): HTMLElement | null {
  const candidates = [
    ".reader_viewer",
    ".viewer_wrap",
    "#_viewer",
    "[data-scroll-container]",
    ".container",
    "main",
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el && getComputedStyle(el).overflowY === "auto") return el;
  }
  return null;
}

function calculateScrollProgress(): number {
  const container = getScrollContainer();
  if (container) {
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    if (scrollHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
  }
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

/**
 * Count images on the page (for manga tracking)
 */
function countMangaPages(): { current: number; total: number } {
  // Common manga image selectors - platform specific first
  const imageSelectors = [
    // Webtoons specific
    ".viewer_img img",
    "#_imageList img",
    ".viewer_lst img",
    ".content_img_wrap img",
    // MangaDex
    ".reader-images img",
    ".md-reader img",
    // General manga readers
    ".chapter-images img",
    ".reading-content img",
    ".manga-reader img",
    "#manga-reader img",
    ".chapter-content img",
    '[class*="page"] img',
    '[class*="chapter"] img:not([class*="thumb"])',
    'main img[src*="chapter"]',
    'main img[src*="page"]',
    ".container-chapter-reader img",
    "#readerarea img",
    // Fallback - any large images in the main content
    "article img",
    ".content img",
  ];

  let images: Element[] = [];
  for (const selector of imageSelectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      // Filter to only get actual manga/comic images (reasonably sized)
      const filtered = Array.from(found).filter((img) => {
        const el = img as HTMLImageElement;
        // Must have a src and be reasonably sized
        if (!el.src) return false;
        const rect = el.getBoundingClientRect();
        // At least 100px in both dimensions for manga panels
        return rect.width > 100 && rect.height > 100;
      });

      if (filtered.length > 0) {
        images = filtered;
        break;
      }
    }
  }

  // If no specific manga images found, try all large images in main content
  if (images.length === 0) {
    const allImages = document.querySelectorAll(
      "main img, article img, .content img, #content img, .viewer img"
    );
    images = Array.from(allImages).filter((img) => {
      const el = img as HTMLImageElement;
      if (!el.src) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 200 && rect.height > 200;
    });
  }

  if (images.length === 0) {
    console.log("[VeTerex] No manga images found");
    return { current: 0, total: 0 };
  }

  console.log("[VeTerex] Found", images.length, "manga pages");

  // Find which image is currently most visible
  const viewportHeight = window.innerHeight;
  const viewportCenter = viewportHeight / 2;
  let currentPage = 1;

  for (let i = 0; i < images.length; i++) {
    const rect = (images[i] as HTMLImageElement).getBoundingClientRect();
    if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
      currentPage = i + 1;
      break;
    }
    if (rect.top > viewportCenter) {
      currentPage = Math.max(1, i);
      break;
    }
    // If we've scrolled past the last image
    if (i === images.length - 1 && rect.bottom < viewportCenter) {
      currentPage = images.length;
    }
  }

  return { current: currentPage, total: images.length };
}

/**
 * Extract chapter information from URL or page
 */
function extractChapterInfo(): {
  chapter: string;
  title: string;
  episode?: string;
} | null {
  const url = window.location.href;

  // Common URL patterns for chapters/episodes
  const chapterPatterns = [
    /chapter[/-](\d+(?:\.\d+)?)/i,
    /ch[/-](\d+(?:\.\d+)?)/i,
    /episode[/-]no?[/-]?(\d+)/i,
    /episode[/-](\d+)/i,
    /ep[/-](\d+(?:\.\d+)?)/i,
    /s\d+-ep-(\d+)/i, // s3-ep-92 pattern
    /episode_no=(\d+)/i,
    /\/(\d+)\/?(?:\?|$)/,
  ];

  for (const pattern of chapterPatterns) {
    const match = url.match(pattern);
    if (match) {
      // Try to get title from page
      let title = "Unknown";
      const titleSelectors = [
        // Webtoons specific
        ".subj_episode",
        ".subj",
        ".episode__title",
        // General
        "h1",
        ".chapter-title",
        ".manga-title",
        ".series-title",
        '[class*="title"]',
        "title",
      ];

      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
          title = el.textContent.trim();
          // Clean up common suffixes
          title = title
            .split(" | ")[0]
            .split(" - ")[0]
            .split(" Chapter ")[0]
            .trim();
          break;
        }
      }

      return { chapter: match[1], title, episode: match[1] };
    }
  }

  return null;
}

/**
 * Track scroll progress for manga/reading content
 */
function startScrollTracking() {
  if (scrollTrackingInterval) return;

  console.log("[VeTerex] Starting scroll/reading tracking");

  const updateScrollProgress = () => {
    const scrollProgress = calculateScrollProgress();
    maxScrollProgress = Math.max(maxScrollProgress, scrollProgress);

    // For manga, also track page position
    const pageInfo = countMangaPages();

    if (currentSession) {
      currentSession.mediaInfo.scrollProgress = maxScrollProgress;

      if (pageInfo.total > 0) {
        currentSession.mediaInfo.currentPage = pageInfo.current;
        currentSession.mediaInfo.totalPages = pageInfo.total;
        // Calculate progress based on pages for manga
        currentSession.mediaInfo.progress = Math.round(
          (pageInfo.current / pageInfo.total) * 100
        );
      } else {
        // Use scroll progress for content without distinct pages
        currentSession.mediaInfo.progress = maxScrollProgress;
      }

      // Check for completion (>85% scroll or reached last page)
      const isScrollComplete = maxScrollProgress >= 85;
      const isPageComplete =
        pageInfo.total > 0 && pageInfo.current >= pageInfo.total - 1;

      if ((isScrollComplete || isPageComplete) && !currentSession.completed) {
        console.log("[VeTerex] Reading completed!", {
          maxScrollProgress,
          pageInfo,
        });
        currentSession.completed = true;
        notifyCompletion(currentSession);
      }

      // Send update to background
      sendTrackingUpdate();
    }
  };

  // Update on scroll with throttling
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  const handleScroll = () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      updateScrollProgress();
      scrollTimeout = null;
    }, 200);
  };

  const container = getScrollContainer();
  if (container) {
    container.addEventListener("scroll", handleScroll, { passive: true });
  } else {
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  // Also check periodically for page changes
  scrollTrackingInterval = setInterval(updateScrollProgress, 3000);
}

/**
 * Stop scroll tracking
 */
function stopScrollTracking() {
  if (scrollTrackingInterval) {
    clearInterval(scrollTrackingInterval);
    scrollTrackingInterval = null;
  }
}

// ========== SCREEN ACTIVITY TRACKING ==========
/**
 * Track user activity (for platforms that block video detection)
 * This monitors: scroll, mouse movement, keyboard, clicks
 */
function startActivityTracking() {
  if (activityTrackingInterval) return;

  console.log("[VeTerex] Starting activity-based tracking");

  const activityEvents = [
    "scroll",
    "mousemove",
    "keydown",
    "click",
    "touchstart",
  ];

  const handleActivity = () => {
    lastActivityTime = Date.now();
    isUserActive = true;
  };

  activityEvents.forEach((event) => {
    window.addEventListener(event, handleActivity, { passive: true });
  });

  // Check activity periodically
  activityTrackingInterval = setInterval(() => {
    const now = Date.now();
    const inactiveTime = now - lastActivityTime;

    // Consider user inactive after 30 seconds of no activity
    if (inactiveTime > 30000) {
      isUserActive = false;
    } else {
      // Add time to active time
      totalActiveTime += 5000; // 5 second intervals
    }

    if (currentSession && isUserActive) {
      currentSession.watchTime = totalActiveTime / 1000;
      currentSession.lastUpdate = now;

      // For video content without detectable video element,
      // estimate progress based on time on page
      const platform = detectPlatform();
      if (
        platform &&
        platform.config.type !== "manga" &&
        platform.config.type !== "book"
      ) {
        // Try to find any indication of duration on the page
        const durationEl = document.querySelector(
          '[class*="duration"], [class*="time"], .runtime'
        );
        if (durationEl?.textContent) {
          const matches = Array.from(
            durationEl.textContent.matchAll(/(\d+):(\d+):?(\d+)?/g)
          );
          if (matches.length) {
            const pick = matches[matches.length - 1];
            const hours = pick[3] ? parseInt(pick[1]) : 0;
            const minutes = pick[3] ? parseInt(pick[2]) : parseInt(pick[1]);
            const seconds = pick[3] ? parseInt(pick[3]) : parseInt(pick[2]);
            const candidate = hours * 3600 + minutes * 60 + seconds;
            const existing = currentSession.mediaInfo.duration || 0;
            const chosen = Math.max(existing, candidate);
            if (chosen > 0) {
              currentSession.mediaInfo.duration = chosen;
              currentSession.mediaInfo.progress = Math.min(
                100,
                Math.round((totalActiveTime / 1000 / chosen) * 100)
              );
            }
          }
        }

        // Completion heuristic: If user has been active for significant time
        // and the page appears to be ending (e.g., credits, next episode prompt)
        const completionIndicators = document.querySelectorAll(
          '[class*="credits"], [class*="next-episode"], [class*="ended"], [class*="finished"], ' +
            '[class*="complete"], .end-credits, .next-up'
        );

        if (
          completionIndicators.length > 0 &&
          totalActiveTime > 60000 &&
          !currentSession.completed
        ) {
          console.log("[VeTerex] Detected completion indicators");
          currentSession.completed = true;
          notifyCompletion(currentSession);
        }
      }

      // Send periodic updates
      sendTrackingUpdate();
    }
  }, 5000);
}

/**
 * Stop activity tracking
 */
function stopActivityTracking() {
  if (activityTrackingInterval) {
    clearInterval(activityTrackingInterval);
    activityTrackingInterval = null;
  }
  totalActiveTime = 0;
  lastActivityTime = Date.now();
}

/**
 * Send tracking update to background script
 */
function sendTrackingUpdate() {
  if (!currentSession) return;

  const sessionData = currentSession.mediaInfo as MediaInfo & { id?: string };
  const sessionId =
    sessionData.id ||
    `${currentSession.mediaInfo.platform}-${currentSession.startTime}`;

  try {
    browserAPI.runtime.sendMessage({
      type: "TRACKING_UPDATE",
      data: {
        id: sessionId,
        ...currentSession.mediaInfo,
        watchTime: currentSession.watchTime,
        completed: currentSession.completed,
      },
    });
  } catch (error) {
    // Extension context may have been invalidated
    console.log("[VeTerex] Could not send tracking update:", error);
  }
}

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
 * Extract Filmboom/Moviebox metadata from API response
 */
function parseFilmboomResponse(
  data: FilmboomApiResponse
): Partial<MediaInfo> | null {
  try {
    if (data.code !== 0 || !data.data?.subject) return null;

    const subject = data.data.subject;
    const trailerDuration =
      (data as any)?.data?.subject?.trailer?.videoAddress?.duration || 0;
    const cover =
      subject.cover?.url || (data as any)?.data?.metadata?.image || "";
    const duration =
      subject.duration && subject.duration > 0
        ? subject.duration
        : trailerDuration || undefined;
    return {
      title: subject.title,
      thumbnail: cover,
      duration,
      description: subject.description,
      genre: subject.genre,
      releaseDate: subject.releaseDate,
    };
  } catch (error) {
    console.error("[VeTerex] Error parsing Filmboom response:", error);
    return null;
  }
}

/**
 * Extract MangaDex chapter metadata from API response
 */
function parseMangaDexResponse(
  data: MangaDexChapterResponse
): Partial<MediaInfo> | null {
  try {
    if (data.result !== "ok" || !data.data?.length) return null;

    // Get the first English chapter or any available chapter
    const chapter =
      data.data.find((c) => c.attributes.translatedLanguage === "en") ||
      data.data[0];
    if (!chapter) return null;

    return {
      title:
        chapter.attributes.title || `Chapter ${chapter.attributes.chapter}`,
      chapter: `Vol. ${chapter.attributes.volume || "?"} Ch. ${
        chapter.attributes.chapter
      }`,
      type: "manga",
    };
  } catch (error) {
    console.error("[VeTerex] Error parsing MangaDex response:", error);
    return null;
  }
}

/**
 * Extract 9anime episode info from server response HTML
 */
function parse9AnimeResponse(
  data: NineAnimeServerResponse
): Partial<MediaInfo> | null {
  try {
    if (!data.status || !data.html) return null;

    // Parse the episode info from the HTML
    const episodeMatch = data.html.match(/Episode\s*(\d+)/i);
    const episode = episodeMatch ? episodeMatch[1] : null;

    return {
      episode: episode || undefined,
      type: "anime",
    };
  } catch (error) {
    console.error("[VeTerex] Error parsing 9anime response:", error);
    return null;
  }
}

/**
 * Intercept XHR requests to capture API responses for metadata
 */
function setupApiInterceptor() {
  const originalFetch = window.fetch;

  // Intercept fetch requests
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url =
      typeof args[0] === "string" ? args[0] : (args[0] as Request).url;

    try {
      // Clone response to read it without consuming
      const clonedResponse = response.clone();

      // Check for Filmboom API
      if (url.includes("wefeed-h5-bff/web/subject/detail")) {
        const data = await clonedResponse.json();
        const metadata = parseFilmboomResponse(data);
        if (metadata) {
          console.log("[VeTerex] Captured Filmboom metadata:", metadata);
          updateSessionWithMetadata(metadata);
        }
      }

      // Check for MangaDex API
      if (url.includes("api.mangadex.org/chapter")) {
        const data = await clonedResponse.json();
        const metadata = parseMangaDexResponse(data);
        if (metadata) {
          console.log("[VeTerex] Captured MangaDex metadata:", metadata);
          updateSessionWithMetadata(metadata);
        }
      }

      // Check for 9anime API
      if (url.includes("/ajax/episode/") || url.includes("servers?episodeid")) {
        const data = await clonedResponse.json();
        const metadata = parse9AnimeResponse(data);
        if (metadata) {
          console.log("[VeTerex] Captured 9anime metadata:", metadata);
          updateSessionWithMetadata(metadata);
        }
      }
    } catch {
      // Silently fail - don't break the original request
    }

    return response;
  };
}

/**
 * Update current session with captured API metadata
 */
function updateSessionWithMetadata(metadata: Partial<MediaInfo>) {
  if (currentSession && currentSession.mediaInfo) {
    if (metadata.title && currentSession.mediaInfo.title === "Unknown Title") {
      currentSession.mediaInfo.title = metadata.title;
    }
    if (metadata.thumbnail && !currentSession.mediaInfo.thumbnail) {
      currentSession.mediaInfo.thumbnail = metadata.thumbnail;
    }
    if (metadata.duration && !currentSession.mediaInfo.duration) {
      currentSession.mediaInfo.duration = metadata.duration;
    }
    if (metadata.description) {
      currentSession.mediaInfo.description = metadata.description;
    }
    if (metadata.genre) {
      currentSession.mediaInfo.genre = metadata.genre;
    }
    if (metadata.chapter) {
      currentSession.mediaInfo.chapter = metadata.chapter;
    }
    if (metadata.episode) {
      currentSession.mediaInfo.episode = metadata.episode;
    }

    // Heuristic duration defaults if still missing
    if (!currentSession.mediaInfo.duration) {
      const t = currentSession.mediaInfo.type;
      if (t === "movie") currentSession.mediaInfo.duration = 2 * 60 * 60; // 2h
      else if (t === "tvshow" || t === "anime")
        currentSession.mediaInfo.duration = 45 * 60; // 45m
    }
  }
}

// Initialize API interceptor
setupApiInterceptor();

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
 * Enhanced to work without video elements for manga/reading sites
 */
function extractMediaInfo(): MediaInfo | null {
  const platform = detectPlatform();
  if (!platform) return null;

  const { name, config } = platform;
  const contentType = config.type;

  try {
    let title = "Unknown Title";
    let progress = 0;
    let duration = 0;
    let thumbnail = "";
    let episode: string | undefined;
    let chapter: string | undefined;

    // Try to get thumbnail from og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      thumbnail = ogImage.getAttribute("content") || "";
    }

    // ========== MANGA/WEBTOON/BOOK SPECIFIC EXTRACTION ==========
    if (contentType === "manga" || contentType === "book") {
      console.log("[VeTerex] Extracting manga/book info...");

      // Try to extract chapter info first
      const chapterInfo = extractChapterInfo();
      if (chapterInfo) {
        chapter = `Chapter ${chapterInfo.chapter}`;
        episode = chapterInfo.episode;
        if (chapterInfo.title !== "Unknown") {
          title = chapterInfo.title;
        }
      }

      // Platform-specific title extraction for manga sites
      // Special handling for Webtoons to get both series title and episode
      if (
        name === "webtoon" ||
        window.location.hostname.includes("webtoons.com")
      ) {
        // Get the series title from og:title or subj element
        let seriesTitle = "";
        let episodeTitle = "";

        // Try to get series title from og:title meta tag (format: "Episode 13 | The Amazing Spider-Man (2022) | WEBTOON")
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          const ogContent = ogTitle.getAttribute("content") || "";
          // Parse the og:title format
          const parts = ogContent.split(" | ");
          if (parts.length >= 2) {
            episodeTitle = parts[0].trim(); // "Episode 13"
            seriesTitle = parts[1].trim(); // "The Amazing Spider-Man (2022)"
          }
        }

        // Fallback: Try to get series title from page elements
        if (!seriesTitle) {
          const subjectEl = document.querySelector(
            ".subj, .info a[href*='/title/'], h1.subj"
          );
          if (subjectEl?.textContent?.trim()) {
            seriesTitle = subjectEl.textContent.trim();
          }
        }

        // Fallback: Try to get episode title from page
        if (!episodeTitle) {
          const episodeEl = document.querySelector(
            ".subj_episode, .episode__title"
          );
          if (episodeEl?.textContent?.trim()) {
            episodeTitle = episodeEl.textContent.trim();
          }
        }

        // Combine series and episode title
        if (seriesTitle && episodeTitle) {
          title = `${seriesTitle} - ${episodeTitle}`;
        } else if (seriesTitle) {
          title = seriesTitle;
        } else if (episodeTitle) {
          title = episodeTitle;
        }

        console.log("[VeTerex] Webtoon title extracted:", {
          seriesTitle,
          episodeTitle,
          combinedTitle: title,
        });
      } else {
        // General manga sites title extraction
        const mangaTitleSelectors = [
          // General manga selectors
          ".manga-title",
          ".series-title",
          ".chapter-title",
          ".reader-header-title",
          "[data-title]",
          "h1",
          "h2.title",
          ".title",
          // Fallback to meta
          'meta[property="og:title"]',
        ];

        for (const selector of mangaTitleSelectors) {
          if (selector.startsWith("meta")) {
            const meta = document.querySelector(selector);
            if (meta) {
              const content = meta.getAttribute("content");
              if (content && content.trim() && content !== title) {
                title = content.trim();
                break;
              }
            }
          } else {
            const el = document.querySelector(selector);
            if (el?.textContent?.trim() && el.textContent.trim().length > 2) {
              title = el.textContent.trim();
              break;
            }
          }
        }
      }

      // Calculate scroll progress for reading content
      progress = calculateScrollProgress();
      maxScrollProgress = Math.max(maxScrollProgress, progress);

      // Also check page count for manga
      const pageInfo = countMangaPages();
      if (pageInfo.total > 0) {
        progress = Math.round((pageInfo.current / pageInfo.total) * 100);
      }

      // Clean up title - remove common suffixes
      if (title !== "Unknown Title") {
        title = title
          .replace(/\s*[-|]\s*WEBTOON$/i, "")
          .replace(/\s*[-|]\s*Webtoons?$/i, "")
          .replace(/\s*[-|]\s*Read Online$/i, "")
          .replace(/\s*[-|]\s*MangaDex$/i, "")
          .trim();
      }

      console.log("[VeTerex] Manga info extracted:", {
        title,
        chapter,
        episode,
        progress,
        pageInfo,
      });
    }
    // ========== VIDEO CONTENT EXTRACTION ==========
    else {
      // Try to find a video element first
      const video = document.querySelector("video");

      if (video) {
        // Video element exists - check if it has duration
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          duration = video.duration;
          progress = (video.currentTime / video.duration) * 100;
          console.log("[VeTerex] Video element found:", {
            duration,
            currentTime: video.currentTime,
            progress,
          });
        } else {
          // Video exists but not ready yet - for YouTube we can still start tracking
          // and update duration later when video loads
          console.log(
            "[VeTerex] Video element found but duration not ready yet"
          );
        }
      } else if (name === "youtube") {
        // On YouTube, if no video element yet, check if it's loading
        const ytPlayer = document.querySelector(".html5-video-player");
        if (ytPlayer) {
          console.log(
            "[VeTerex] YouTube player container found, video may be loading"
          );
        }
      }

      // Special handling for YouTube
      if (name === "youtube") {
        const titleSelectors = [
          "h1.ytd-watch-metadata yt-formatted-string",
          "h1.ytd-video-primary-info-renderer yt-formatted-string",
          "#title h1 yt-formatted-string",
          "#above-the-fold #title yt-formatted-string",
          "ytd-watch-metadata #title yt-formatted-string",
          ".ytp-title-link",
          "ytd-watch-metadata h1",
          "#container h1.title",
          "ytd-reel-video-renderer h2.title",
          ".reel-video-in-sequence ytd-reel-player-header-renderer h2",
          // Additional YouTube selectors
          "#info h1.title yt-formatted-string",
          "#meta h1 yt-formatted-string",
          "ytd-video-primary-info-renderer #title yt-formatted-string",
        ];

        for (const selector of titleSelectors) {
          const el = document.querySelector(selector);
          if (el?.textContent?.trim()) {
            title = el.textContent.trim();
            console.log(
              "[VeTerex] YouTube title found with selector:",
              selector,
              title
            );
            break;
          }
        }

        // If still no title, try document.title as fallback for YouTube
        if (title === "Unknown Title" && document.title) {
          // YouTube title format: "Video Title - YouTube"
          const docTitle = document.title.replace(" - YouTube", "").trim();
          if (docTitle && docTitle.length > 2 && docTitle !== "YouTube") {
            title = docTitle;
            console.log("[VeTerex] YouTube title from document.title:", title);
          }
        }
      } else {
        // Generic video site title extraction
        const videoTitleSelectors = [
          // Specific platform selectors
          ".heading-name",
          ".film-name",
          ".movie-title",
          ".video-title",
          ".dp-i-title",
          ".title h1",
          "h1.title",
          // Filmboom/Moviebox specific - title from page header
          ".detail-page h1",
          ".movie-info h1",
          ".video-info h1",
          // General
          ...config.selectors.title.split(",").map((s) => s.trim()),
          "h1",
          'meta[property="og:title"]',
          "title",
        ];

        for (const selector of videoTitleSelectors) {
          if (selector === 'meta[property="og:title"]') {
            const meta = document.querySelector(selector);
            if (meta) {
              const content = meta.getAttribute("content");
              if (content && content.trim()) {
                title = content.trim();
                break;
              }
            }
          } else if (selector === "title") {
            if (document.title && document.title.trim()) {
              title = document.title
                .split("|")[0]
                .split(" - ")[0]
                .split("—")[0]
                .trim();
              break;
            }
          } else {
            const el = document.querySelector(selector);
            if (el?.textContent?.trim() && el.textContent.trim().length > 2) {
              title = el.textContent.trim();
              break;
            }
          }
        }

        // If no video element found, try to detect iframe-based players
        if (!video || !video.duration) {
          const iframe = document.querySelector(
            'iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"]'
          );
          if (iframe) {
            console.log(
              "[VeTerex] Video iframe detected, using activity tracking"
            );
            // We'll rely on activity tracking for progress
            progress = maxScrollProgress || 0;
          }
        }
      }

      // Clean up video title
      if (title !== "Unknown Title") {
        title = title
          .replace(/\s*[-|]\s*Watch Online$/i, "")
          .replace(/\s*[-|]\s*Free$/i, "")
          .replace(/\s*[-|]\s*HD$/i, "")
          .replace(/\s*[-|]\s*Full Movie$/i, "")
          .trim();
      }
    }

    // Final fallback: use document title
    if (title === "Unknown Title" && document.title) {
      title = document.title.split("|")[0].split(" - ")[0].split("—")[0].trim();
    }

    // For manga/book sites, we can track even without perfect title extraction
    // since we have scroll progress and page tracking
    const isMangaOrBook = contentType === "manga" || contentType === "book";

    // For YouTube, we can track even if video is not ready yet - title is enough
    const isYouTube = name === "youtube";

    // Only skip if no title AND it's not a manga/book site AND not YouTube with a title
    if (title === "Unknown Title" && !isMangaOrBook && !isYouTube) {
      console.log(
        "[VeTerex] Could not extract title for video content, skipping"
      );
      return null;
    }

    // For YouTube, if we have a title, we can start tracking even without video duration
    if (isYouTube && title !== "Unknown Title") {
      console.log(
        "[VeTerex] YouTube: starting tracking with title, will update duration later"
      );
    }

    // For manga, use URL-based title as fallback
    if (title === "Unknown Title" && isMangaOrBook) {
      // Try to get title from URL path
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        // Convert slug to title (e.g., "the-price-is-your-everything" -> "The Price Is Your Everything")
        const slug =
          pathParts.find((p) => !p.match(/^\d+$/) && p.length > 3) ||
          pathParts[0];
        title = slug
          .replace(/-/g, " ")
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    console.log("[VeTerex] Extracted media info:", {
      platform: name,
      type: contentType,
      title,
      progress,
      duration,
      chapter,
      episode,
    });

    return {
      platform: name,
      type: contentType,
      title,
      url: window.location.href,
      progress,
      duration,
      thumbnail,
      timestamp: Date.now(),
      episode,
      chapter,
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
  const platform = detectPlatform();
  const contentType = platform?.config.type;

  currentSession.lastUpdate = now;
  currentSession.mediaInfo.progress = mediaInfo.progress;
  currentSession.mediaInfo.duration = mediaInfo.duration;

  // Update chapter/episode info if available
  if (mediaInfo.chapter) currentSession.mediaInfo.chapter = mediaInfo.chapter;
  if (mediaInfo.episode) currentSession.mediaInfo.episode = mediaInfo.episode;

  // ========== PROGRESS TRACKING BASED ON CONTENT TYPE ==========
  if (contentType === "manga" || contentType === "book") {
    // For manga/reading content, use scroll progress and page tracking
    const scrollProgress = calculateScrollProgress();
    maxScrollProgress = Math.max(maxScrollProgress, scrollProgress);

    const pageInfo = countMangaPages();

    if (pageInfo.total > 0) {
      currentSession.mediaInfo.progress = Math.round(
        (pageInfo.current / pageInfo.total) * 100
      );
      currentSession.mediaInfo.currentPage = pageInfo.current;
      currentSession.mediaInfo.totalPages = pageInfo.total;
      currentSession.watchTime = Math.round(totalActiveTime / 1000);
    } else {
      currentSession.mediaInfo.progress = maxScrollProgress;
      currentSession.mediaInfo.scrollProgress = maxScrollProgress;
      currentSession.watchTime = Math.round(totalActiveTime / 1000);
    }

    // Check completion for reading content
    const progress = currentSession.mediaInfo.progress || 0;
    const isScrollComplete = maxScrollProgress >= 85;
    const isPageComplete =
      pageInfo.total > 0 && pageInfo.current >= pageInfo.total - 1;

    if (
      (isScrollComplete || isPageComplete || progress >= 85) &&
      !currentSession.completed
    ) {
      console.log("[VeTerex] Reading completed!", {
        maxScrollProgress,
        pageInfo,
        progress,
      });
      currentSession.completed = true;
      notifyCompletion(currentSession);
    }
  } else {
    // For video content
    const video = document.querySelector("video");
    if (video && !isNaN(video.currentTime)) {
      // Use the actual video currentTime as watch time
      currentSession.watchTime = video.currentTime;
    } else {
      // Fallback: use active time tracking
      currentSession.watchTime = totalActiveTime / 1000;

      // Also use active time for progress estimation if no video duration
      if (mediaInfo.duration && mediaInfo.duration > 0) {
        currentSession.mediaInfo.progress = Math.min(
          100,
          Math.round((totalActiveTime / 1000 / mediaInfo.duration) * 100)
        );
      }
    }

    // Check if completed (>90% progress or near end of video)
    const progress = currentSession.mediaInfo.progress ?? 0;
    const isNearEnd =
      mediaInfo.duration && mediaInfo.duration > 0
        ? progress >= 90 ||
          mediaInfo.duration - (progress / 100) * mediaInfo.duration < 30
        : progress >= 90;

    if (isNearEnd && !currentSession.completed) {
      currentSession.completed = true;
      notifyCompletion(currentSession);
    }
  }

  // Get the session ID
  const sessionData = currentSession.mediaInfo as MediaInfo & { id?: string };
  const sessionId =
    sessionData.id ||
    `${currentSession.mediaInfo.platform}-${currentSession.startTime}`;

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
      chapter: currentSession.mediaInfo.chapter,
      episode: currentSession.mediaInfo.episode,
      currentPage: currentSession.mediaInfo.currentPage,
      totalPages: currentSession.mediaInfo.totalPages,
      scrollProgress: currentSession.mediaInfo.scrollProgress,
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
  showCompletionBanner(session.mediaInfo, session.watchTime);
}

/**
 * Show track series button using extracted UI module
 */
function showTrackSeriesButton() {
  const existing = document.getElementById("veterex-track-series");
  if (existing) return;

  const info = extractMediaInfo();
  if (!info || info.type !== "manga") return;

  // Use the extracted UI module
  showTrackSeriesButtonUI(info.title, () => extractChapterInfo());
}

/**
 * Show a banner to the user offering to mint NFT using extracted UI module
 */
function showCompletionBanner(mediaInfo: MediaInfo, watchTime?: number) {
  showCompletionBannerUI({
    mediaInfo,
    watchTime: watchTime || currentSession?.watchTime || 0,
  });
}

/**
 * Initialize content script
 */
function init() {
  // ALWAYS setup extension bridge first for session sync on any page
  // This is critical for localhost auth redirect flow
  setupExtensionBridge();

  const platform = detectPlatform();
  if (!platform) {
    console.log(
      "[VeTerex] Not a supported media platform, but bridge is active for session sync"
    );
    return;
  }

  console.log(
    "[VeTerex] Content script initialized on:",
    platform.name,
    "type:",
    platform.config.type
  );

  const contentType = platform.config.type;
  const isMangaOrBook = contentType === "manga" || contentType === "book";

  // For manga/book sites, start tracking immediately since we don't need video elements
  if (isMangaOrBook) {
    console.log(
      "[VeTerex] Manga/book content detected, starting tracking immediately"
    );

    // Small delay to ensure page has loaded basic content
    setTimeout(() => {
      startTracking();
      startScrollTracking();
      startActivityTracking();
      showTrackSeriesButton();
    }, 1500);
  } else {
    // For video content, use mutation observer to wait for video to load
    let initTimeout: ReturnType<typeof setTimeout>;

    const tryStartTracking = () => {
      if (!currentSession) {
        console.log("[VeTerex] Trying to start video tracking...");
        startTracking();
        // Start activity tracking as fallback for video sites with anti-debugging
        startActivityTracking();
      }
    };

    const observer = new MutationObserver(() => {
      // Debounce initialization
      clearTimeout(initTimeout);
      initTimeout = setTimeout(() => {
        tryStartTracking();
      }, 2000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also try after initial delay
    setTimeout(() => {
      if (!currentSession) {
        console.log("[VeTerex] Attempting initial video tracking...");
        tryStartTracking();
      }
    }, 3000);
  }

  // Stop tracking when page is unloaded
  window.addEventListener("beforeunload", () => {
    stopTracking();
    stopScrollTracking();
    stopActivityTracking();
  });

  // Handle visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Don't fully stop on hide, just pause activity tracking
      stopActivityTracking();
    } else if (detectPlatform()) {
      // Resume tracking when visible
      if (!currentSession) {
        startTracking();
      }
      startActivityTracking();
      if (isMangaOrBook) {
        startScrollTracking();
      }
    }
  });
}

/**
 * Setup bridge for communication between web app and extension
 * This allows the web app to share session data with the extension
 */
function setupExtensionBridge() {
  // Message types
  const MESSAGE_TYPES = {
    SESSION_DATA: "VETEREX_SESSION_DATA",
    REQUEST_SESSION: "VETEREX_REQUEST_SESSION",
    SESSION_RECEIVED: "VETEREX_SESSION_RECEIVED",
    EXTENSION_READY: "VETEREX_EXTENSION_READY",
  };

  // Storage key
  const STORAGE_KEY = "veterex_session";

  // Connect to extension background
  let port: chrome.runtime.Port | null = null;
  try {
    port = chrome.runtime.connect({ name: "veterex-bridge" });
    console.log("[VeTerex Bridge] Connected to extension background");

    // Listen for messages from background
    port.onMessage.addListener((message) => {
      if (message.type === MESSAGE_TYPES.SESSION_DATA) {
        // Forward to web page
        window.postMessage(
          {
            type: MESSAGE_TYPES.SESSION_RECEIVED,
            source: "veterex-extension",
            data: message.data,
          },
          "*"
        );
      }
    });
  } catch {
    console.log("[VeTerex Bridge] Could not connect to background");
  }

  // Listen for messages from web page
  window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    const message = event.data;

    // Only handle messages from our web app
    if (message && message.source === "veterex-web") {
      console.log(
        "[VeTerex Bridge] Received from web app:",
        message.type,
        message
      );

      // Handle SESSION_DATA or SESSION_SYNC (both are used for session sync)
      if (
        message.type === MESSAGE_TYPES.SESSION_DATA ||
        message.type === "SESSION_SYNC"
      ) {
        console.log(
          "[VeTerex Bridge] Saving session to chrome.storage:",
          message.data
        );

        // Save to chrome.storage
        chrome.storage.local.set({
          [STORAGE_KEY]: message.data,
        });

        // Forward to background if connected
        if (port) {
          port.postMessage({
            type: MESSAGE_TYPES.SESSION_DATA,
            data: message.data,
          });
        }

        // Also send directly to background via runtime.sendMessage
        chrome.runtime
          .sendMessage({
            type: "SESSION_UPDATED",
            data: message.data,
          })
          .catch(() => {
            // Extension popup might not be open
          });

        // Acknowledge receipt to web app
        window.postMessage(
          {
            type: "SESSION_SYNC_ACK",
            source: "veterex-extension",
            success: true,
          },
          "*"
        );
      }

      if (message.type === MESSAGE_TYPES.REQUEST_SESSION) {
        // Get session from chrome.storage and send back
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (result[STORAGE_KEY]) {
            window.postMessage(
              {
                type: MESSAGE_TYPES.SESSION_RECEIVED,
                source: "veterex-extension",
                data: result[STORAGE_KEY],
              },
              "*"
            );
          }
        });
      }
    }
  });

  // Notify web app that extension is ready
  window.postMessage(
    {
      type: MESSAGE_TYPES.EXTENSION_READY,
      source: "veterex-extension",
    },
    "*"
  );

  console.log("[VeTerex Bridge] Extension bridge initialized");
}

// Start initialization
document.addEventListener(
  "play",
  (e) => {
    const el = e.target as HTMLVideoElement;
    // Start tracking when video plays, even if duration isn't ready yet
    if (el && !currentSession) {
      console.log("[VeTerex] Video play event detected, starting tracking");
      startTracking();
    }
  },
  true
);

// Also listen for timeupdate which fires reliably during playback
document.addEventListener(
  "timeupdate",
  (e) => {
    const el = e.target as HTMLVideoElement;
    if (el && el.currentTime > 0 && !currentSession) {
      console.log("[VeTerex] Video timeupdate detected, starting tracking");
      startTracking();
    }
  },
  true
);

init();
