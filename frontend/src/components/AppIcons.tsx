/**
 * VeTerex App Icons
 * Centralized icon components and image data for the application
 * Based on Figma design system
 */

import React from "react";

// ============================================================================
// Icon Props Type
// ============================================================================
interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// ============================================================================
// SVG Icon Components
// ============================================================================

/**
 * VeTerex Logo Icon - Main brand logo
 * Achievement/Trophy design representing media completion tracking
 */
export const LogoIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6D75" />
        <stop offset="100%" stopColor="#9C86FF" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#logo-gradient)" />
    {/* Upper diamond/gem shape */}
    <path d="M64 20L84 50H44L64 20Z" fill="white" opacity="0.95" />
    {/* Lower inverted triangle - trophy/achievement look */}
    <path d="M44 50H84L64 108L44 50Z" fill="white" opacity="0.9" />
    {/* Center accent circle - completion badge */}
    <circle cx="64" cy="58" r="10" fill="url(#logo-gradient)" opacity="0.6" />
  </svg>
);

/**
 * VeryChat Logo Icon
 */
export const VeryChatLogoIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="48" height="48" rx="12" fill="#7C60FD" />
    <path d="M24 8L32 20H36L24 40L12 20H16L24 8Z" fill="white" opacity="0.95" />
    <circle cx="24" cy="22" r="4" fill="white" />
  </svg>
);

/**
 * Confetti Icon - For celebrations and success states
 */
export const ConfettiIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 4L2 22L20 20L4 4Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4 4L12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M15 3V6" stroke="#FF6D75" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M18 6L16 8"
      stroke="#FEEA46"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M21 9H18" stroke="#7C60FD" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 2V4" stroke="#4BE15A" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M22 13L20 13"
      stroke="#FF6D75"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 6L12 4"
      stroke="#9D87FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Treasure/Gift Icon - For rewards
 */
export const TreasureIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 12V22H4V12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 7H2V12H22V7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22V7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Gift Box Icon - For gifts and rewards
 */
export const GiftBoxIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="8"
      width="18"
      height="4"
      rx="1"
      stroke={color}
      strokeWidth="2"
    />
    <rect
      x="4"
      y="12"
      width="16"
      height="10"
      rx="1"
      stroke={color}
      strokeWidth="2"
    />
    <path d="M12 8V22" stroke={color} strokeWidth="2" />
    <path
      d="M12 8C12 8 12 5 9 3C6 1 4 3 5 5C6 7 12 8 12 8Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 8C12 8 12 5 15 3C18 1 20 3 19 5C18 7 12 8 12 8Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Shield Icon - For security/verification
 */
export const ShieldIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Lock Icon - For locked states
 */
export const LockedIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1" fill={color} />
  </svg>
);

/**
 * Unlocked Icon - For unlocked states
 */
export const UnlockedIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.0503 2 15.8124 3.2341 16.584 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1" fill={color} />
  </svg>
);

/**
 * Wallet Icon - For wallet/balance
 */
export const WalletIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="6"
      width="20"
      height="14"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M22 10H18C16.8954 10 16 10.8954 16 12C16 13.1046 16.8954 14 18 14H22"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M6 6V4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V6"
      stroke={color}
      strokeWidth="2"
    />
    <circle cx="18" cy="12" r="1" fill={color} />
  </svg>
);

/**
 * Clock Icon - For time/progress
 */
export const ClockIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path
      d="M12 6V12L16 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Pin Icon - For PIN entry
 */
export const PinIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
      stroke={color}
      strokeWidth="2"
    />
    <circle cx="8" cy="16" r="1.5" fill={color} />
    <circle cx="12" cy="16" r="1.5" fill={color} />
    <circle cx="16" cy="16" r="1.5" fill={color} />
  </svg>
);

/**
 * NFT Mining Icon - For minting NFTs
 */
export const NFTMiningIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill={color} opacity="0.5" />
  </svg>
);

/**
 * Very Coin Icon - For rewards/currency
 */
export const VeryCoinIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="url(#coin-gradient)" />
    <circle
      cx="12"
      cy="12"
      r="7"
      stroke="white"
      strokeWidth="1.5"
      opacity="0.5"
    />
    <path d="M12 6L14 10H16L12 18L8 10H10L12 6Z" fill="white" opacity="0.9" />
    <defs>
      <linearGradient id="coin-gradient" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#FEEA46" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Very Card Icon - For card/handle
 */
export const VeryCardIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="3"
      stroke={color}
      strokeWidth="2"
    />
    <circle cx="8" cy="10" r="2" stroke={color} strokeWidth="1.5" />
    <path
      d="M6 15C6 13.8954 6.89543 13 8 13C9.10457 13 10 13.8954 10 15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="13"
      y1="9"
      x2="20"
      y2="9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="13"
      y1="13"
      x2="18"
      y2="13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Link Icon - For connections
 */
export const LinkIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4508 9.59698 21.9548 8.33398 21.9434 7.02298C21.932 5.71198 21.4061 4.45794 20.4791 3.53094C19.5521 2.60394 18.2981 2.078 16.9871 2.06661C15.6761 2.05521 14.4131 2.55918 13.47 3.46998L11.75 5.17998"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 11C13.5705 10.4259 13.0226 9.95082 12.3934 9.60706C11.7642 9.26329 11.0685 9.05887 10.3533 9.00768C9.63816 8.95649 8.92037 9.05962 8.24861 9.31023C7.57685 9.56084 6.96684 9.95291 6.45999 10.46L3.45999 13.46C2.54919 14.403 2.04522 15.666 2.05662 16.977C2.06801 18.288 2.59395 19.5421 3.52095 20.4691C4.44795 21.3961 5.70199 21.922 7.01299 21.9334C8.32399 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Cloud Icon - For cloud/sync
 */
export const CloudIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18 10H16.74C16.3659 8.55179 15.5928 7.23827 14.5086 6.20911C13.4245 5.17996 12.0727 4.47728 10.6069 4.18029C9.14113 3.88331 7.62192 4.00417 6.22298 4.52863C4.82405 5.05309 3.60282 5.9596 2.70104 7.14472C1.79927 8.32983 1.25298 9.74545 1.12384 11.2262C0.994703 12.707 1.28793 14.193 1.97064 15.5177C2.65335 16.8424 3.6987 17.9538 4.98835 18.7286C6.278 19.5034 7.76243 19.912 9.27 19.912H18C19.3261 19.912 20.5979 19.3852 21.5355 18.4476C22.4732 17.5099 23 16.2381 23 14.912C23 13.586 22.4732 12.3141 21.5355 11.3765C20.5979 10.4388 19.3261 9.91205 18 9.91205V10Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Comment Plus Icon - For adding comments
 */
export const CommentPlusIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="7"
      x2="12"
      y2="13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="9"
      y1="10"
      x2="15"
      y2="10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Comments Icon - For community/discussions
 */
export const CommentsIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Booster/Rocket Icon - For boost features
 */
export const BoosterIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.5 16.5C3 18 3 20.5 3 20.5C3 20.5 5.5 20.5 7 19C7.89 18.11 7.89 16.61 7 15.73C6.11 14.84 4.61 14.84 3.73 15.73L4.5 16.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 5L18 8L21 5C21 5 20.5 2 17 2C13.5 2 15 5 15 5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 9.5L6 13C4 15 4 17 4 17L7 20C7 20 9 20 11 18L14.5 14.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 4.5L19 9C19 9 22 6 20 3C18 0 14.5 4.5 14.5 4.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Plus Square Icon - For adding items
 */
export const PlusSquareIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="12"
      x2="16"
      y2="12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Wax Seal Icon - For verification/authenticity
 */
export const WaxSealIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" />
    <path d="M12 9L13 11H15L12 15L9 11H11L12 9Z" fill={color} />
    <path d="M4 20L2 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path
      d="M20 20L22 22"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M20 4L22 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Fruit Icon - For rewards/berries
 */
export const FruitIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <ellipse cx="12" cy="14" rx="7" ry="8" fill="url(#fruit-gradient)" />
    <path
      d="M12 2C12 2 14 4 14 6C14 8 12 8 12 8"
      stroke="#4BE15A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 8C10 8 8 6 10 4"
      stroke="#4BE15A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="fruit-gradient" x1="5" y1="6" x2="19" y2="22">
        <stop stopColor="#FF6D75" />
        <stop offset="1" stopColor="#E55A62" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Open Cookie Icon - For fortune/reveal
 */
export const OpenCookieIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C7 2 3 6 3 11C3 14 5 16 7 17L6 22L12 19L18 22L17 17C19 16 21 14 21 11C21 6 17 2 12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 10H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 13H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Seeds to Fruits Icon - For growth/progress
 */
export const SeedsToFruitsIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
  color = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <ellipse cx="6" cy="18" rx="3" ry="4" stroke={color} strokeWidth="2" />
    <path d="M6 14V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="6" cy="8" r="2" stroke={color} strokeWidth="1.5" />
    <path d="M12 22V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="12" cy="12" rx="4" ry="5" stroke={color} strokeWidth="2" />
    <path d="M12 7V4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="14" r="5" fill="url(#seed-fruit-gradient)" />
    <path d="M18 9V6" stroke="#4BE15A" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M16 6C16 6 17 4 18 4C19 4 20 6 20 6"
      stroke="#4BE15A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="seed-fruit-gradient" x1="13" y1="9" x2="23" y2="19">
        <stop stopColor="#FF6D75" />
        <stop offset="1" stopColor="#E55A62" />
      </linearGradient>
    </defs>
  </svg>
);

// ============================================================================
// Navigation Icon Components (using PNG/SVG from public/icons)
// ============================================================================

interface NavIconProps {
  isActive?: boolean;
  className?: string;
  size?: number;
}

/**
 * Home Navigation Icon
 */
export const HomeNavIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/home-on.svg" : "/icons/home-off.svg"}
    alt="Home"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Collections Navigation Icon
 */
export const CollectionsNavIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/collections-on.png" : "/icons/collections-off.svg"}
    alt="Collections"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Community/Channel Navigation Icon
 */
export const CommunityNavIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/channel-on.svg" : "/icons/channel-off.svg"}
    alt="Community"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Crown Icon (for achievements)
 */
export const CrownIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/crown-on.svg" : "/icons/crown-off.svg"}
    alt="Crown"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Star Icon (for completed/favorites)
 */
export const StarIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/star-on.svg" : "/icons/star-off.svg"}
    alt="Star"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Flag Icon
 */
export const FlagIcon: React.FC<NavIconProps> = ({
  isActive = false,
  className = "",
  size = 24,
}) => (
  <img
    src={isActive ? "/icons/flag-on.svg" : "/icons/flag-off.svg"}
    alt="Flag"
    className={className}
    style={{ width: size, height: size }}
  />
);

// ============================================================================
// Image-based Icon Components (PNG icons from design)
// ============================================================================

interface ImageIconProps {
  className?: string;
  size?: number;
}

/**
 * VeryCard Icon (PNG) - for VeryChat handle input
 */
export const VeryCardImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/very-card.png"
    alt="VeryCard"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * PIN Icon (PNG) - for verification code input
 */
export const PinImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/pin.png"
    alt="PIN"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Wallet Icon (PNG) - for wallet connection
 * Use inverted=true for white icon on dark backgrounds
 */
export const WalletImageIcon: React.FC<
  ImageIconProps & { inverted?: boolean }
> = ({ className = "", size = 24, inverted = false }) => (
  <img
    src="/icons/wallet.png"
    alt="Wallet"
    className={className}
    style={{
      width: size,
      height: size,
      filter: inverted ? "brightness(0) invert(1)" : undefined,
    }}
  />
);

/**
 * NFT Mining Icon (PNG) - for minting
 * Shows the original colored icon by default
 */
export const NFTMiningImageIcon: React.FC<
  ImageIconProps & { inverted?: boolean }
> = ({
  className = "",
  size = 48,
  inverted = false, // Default to original colors
}) => (
  <img
    src="/icons/nft-mining.png"
    alt="NFT Mining"
    className={className}
    style={{
      width: size,
      height: size,
      filter: inverted ? "brightness(0) invert(1)" : undefined,
    }}
  />
);

/**
 * Mint Icon (PNG) - for minting NFTs
 * Uses the mint.png icon
 */
export const MintImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/mint.png"
    alt="Mint"
    className={className}
    style={{
      width: size,
      height: size,
    }}
  />
);

/**
 * Very Coin Icon (PNG) - for rewards/minting
 */
export const VeryCoinImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/very-coin.png"
    alt="Very Coin"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Confetti Icon (SVG) - for celebrations
 */
export const ConfettiImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/confetti.svg"
    alt="Confetti"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Treasure Icon (SVG) - for rewards
 */
export const TreasureImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/treasure.svg"
    alt="Treasure"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Gift Box Icon (PNG) - for gifts
 */
export const GiftBoxImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/gift-box.png"
    alt="Gift Box"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Shield Icon (PNG) - for security
 */
export const ShieldImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/shield.png"
    alt="Shield"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Locked Icon (PNG)
 */
export const LockedImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/locked.png"
    alt="Locked"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Unlocked Icon (PNG)
 */
export const UnlockedImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/unlocked.png"
    alt="Unlocked"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Clock Icon (PNG)
 */
export const ClockImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/clock.png"
    alt="Clock"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Cloud Icon (SVG)
 */
export const CloudImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/cloud.svg"
    alt="Cloud"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Booster Icon (SVG)
 */
export const BoosterImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/booster.svg"
    alt="Booster"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Fruit Color Icon (PNG)
 */
export const FruitColorImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/Fruit_color.png"
    alt="Fruit"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Open Cookie Icon (SVG) - fortune cookie
 */
export const OpenCookieImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/open-cookie.svg"
    alt="Fortune Cookie"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * VeryChat Logo Icon (SVG)
 */
export const VeryChatLogoImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/verychat-logo.svg"
    alt="VeryChat"
    className={className}
    style={{ width: size, height: size }}
  />
);
/**
 * VeryChat Logo Icon (PNG)
 */
export const VeryLogoImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/very_logo.png"
    alt="VeryLogo"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Wepin Logo Icon (PNG) - for wallet authentication
 */
export const WepinLogoImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/wepin_logo.png"
    alt="Wepin"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Fruit Icon (PNG) - for tracking series
 * Use inverted=true for white icon on dark backgrounds
 */
export const FruitImageIcon: React.FC<
  ImageIconProps & { inverted?: boolean }
> = ({ className = "", size = 24, inverted = false }) => (
  <img
    src="/icons/fruit.png"
    alt="Track Series"
    className={className}
    style={{
      width: size,
      height: size,
      filter: inverted ? "brightness(0) invert(1)" : undefined,
    }}
  />
);

/**
 * Giftbox Icon (SVG) - for rewards/gifts
 */
export const GiftboxImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/giftbox.svg"
    alt="Giftbox"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Gift Box in Container Icon (SVG)
 */
export const GiftBoxContainerImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/gift-box(in_container).svg"
    alt="Gift Box"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Logo Icon (SVG) - Main app logo
 */
export const LogoImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/logo.svg"
    alt="Logo"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Main Visual Icon (SVG)
 */
export const MainVisualImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/main_visual.svg"
    alt="Main Visual"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * NFT Mining Icon (PNG) - for minting
 */
export const NFTMiningPngImageIcon: React.FC<
  ImageIconProps & { inverted?: boolean }
> = ({ className = "", size = 48, inverted = false }) => (
  <img
    src="/icons/nft-mining.png"
    alt="NFT Mining"
    className={className}
    style={{
      width: size,
      height: size,
      filter: inverted ? "brightness(0) invert(1)" : undefined,
    }}
  />
);

/**
 * Link Icon (SVG)
 */
export const LinkImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/link.svg"
    alt="Link"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Plus Square Icon (SVG)
 */
export const PlusSquareImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/plus-square.svg"
    alt="Plus Square"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Wax Seal Icon (PNG)
 */
export const WaxSealImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/wax-seal.png"
    alt="Wax Seal"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Wallet Balance Icon (PNG)
 */
export const WalletBalanceImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/wallet:balance.png"
    alt="Wallet Balance"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Seeds to Fruits Icon (SVG)
 */
export const SeedsToFruitsImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/Seeds_to_Fruits.svg"
    alt="Seeds to Fruits"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Comment Plus Icon (SVG)
 */
export const CommentPlusImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/comment-plus.svg"
    alt="Comment Plus"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Comments Icon (SVG)
 */
export const CommentsImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/comments.svg"
    alt="Comments"
    className={className}
    style={{ width: size, height: size }}
  />
);

/**
 * Clock Icon (SVG)
 */
export const ClockSvgImageIcon: React.FC<ImageIconProps> = ({
  className = "",
  size = 48,
}) => (
  <img
    src="/icons/clock.svg"
    alt="Clock"
    className={className}
    style={{ width: size, height: size }}
  />
);
