/**
 * VeTerex App Image Data
 * Static icon paths and image data for the application
 * Based on Figma design system
 *
 * Separated from AppIcons.tsx to fix Fast Refresh ESLint warnings
 */

// ============================================================================
// Image Data (PNG/SVG paths from public/icons)
// ============================================================================

/**
 * Static icon paths for PNG/SVG images
 * These are referenced from the public/icons folder
 */
export const AppImageData = {
  // Main logos
  logo: "/icons/logo.svg",
  logoIcon: "/icons/icon.svg",
  logoSmall: "/icons/icon16.png",
  logoMedium: "/icons/icon48.png",
  logoLarge: "/icons/icon128.png",
  mainVisual: "/icons/main_visual.svg",

  // VeryChat/Partner logos
  verychatLogo: "/icons/verychat-logo.svg",
  veryLogo: "/icons/very_logo.png",
  wepinLogo: "/icons/wepin_logo.png",
  wepinLogoAvif: "/icons/wepin_logo.avif",

  // Feature Icons (PNG)
  nftMining: "/icons/nft-mining.png",
  veryCoin: "/icons/very-coin.png",
  veryCard: "/icons/very-card.png",
  pin: "/icons/pin.png",
  clock: "/icons/clock.png",
  shield: "/icons/shield.png",
  locked: "/icons/locked.png",
  unlocked: "/icons/unlocked.png",
  wallet: "/icons/wallet.png",
  walletBalance: "/icons/wallet:balance.png",
  giftBox: "/icons/gift-box.png",
  fruit: "/icons/fruit.png",
  fruitColor: "/icons/Fruit_color.png",
  waxSeal: "/icons/wax-seal.png",

  // Feature Icons (SVG)
  booster: "/icons/booster.svg",
  treasure: "/icons/treasure.svg",
  clockSvg: "/icons/clock.svg",
  cloud: "/icons/cloud.svg",
  confetti: "/icons/confetti.svg",
  comments: "/icons/comments.svg",
  commentPlus: "/icons/comment-plus.svg",
  link: "/icons/link.svg",
  plusSquare: "/icons/plus-square.svg",
  openCookie: "/icons/open-cookie.svg",
  giftBoxSvg: "/icons/gift-box.svg",
  giftboxAlt: "/icons/giftbox.svg",
  giftBoxContainer: "/icons/gift-box(in_container).svg",
  seedsToFruits: "/icons/Seeds_to_Fruits.svg",

  // Navigation Icons (On/Off states)
  homeOn: "/icons/home-on.svg",
  homeOff: "/icons/home-off.svg",
  collectionsOn: "/icons/collections-on.png",
  collectionsOff: "/icons/collections-off.svg",
  channelOn: "/icons/channel-on.svg",
  channelOff: "/icons/channel-off.svg",
  crownOn: "/icons/crown-on.svg",
  crownOff: "/icons/crown-off.svg",
  flagOn: "/icons/flag-on.svg",
  flagOff: "/icons/flag-off.svg",
  starOn: "/icons/star-on.svg",
  starOff: "/icons/star-off.svg",
} as const;

// Type for AppImageData keys
export type AppImageKey = keyof typeof AppImageData;

// ============================================================================
// Icon Categories for Easy Reference
// ============================================================================

export const NavIcons = {
  home: { on: AppImageData.homeOn, off: AppImageData.homeOff },
  collections: {
    on: AppImageData.collectionsOn,
    off: AppImageData.collectionsOff,
  },
  community: { on: AppImageData.channelOn, off: AppImageData.channelOff },
  crown: { on: AppImageData.crownOn, off: AppImageData.crownOff },
  flag: { on: AppImageData.flagOn, off: AppImageData.flagOff },
  star: { on: AppImageData.starOn, off: AppImageData.starOff },
} as const;

export const AuthIcons = {
  veryCard: AppImageData.veryCard,
  pin: AppImageData.pin,
  wallet: AppImageData.wallet,
  shield: AppImageData.shield,
  verychatLogo: AppImageData.verychatLogo,
} as const;

export const MintIcons = {
  nftMining: AppImageData.nftMining,
  veryCoin: AppImageData.veryCoin,
  confetti: AppImageData.confetti,
  treasure: AppImageData.treasure,
  giftBox: AppImageData.giftBox,
} as const;

export const StatusIcons = {
  locked: AppImageData.locked,
  unlocked: AppImageData.unlocked,
  clock: AppImageData.clock,
  crown: { on: AppImageData.crownOn, off: AppImageData.crownOff },
  star: { on: AppImageData.starOn, off: AppImageData.starOff },
} as const;

export default AppImageData;
