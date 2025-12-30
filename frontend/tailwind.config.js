/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Main brand colors from Figma
        coral: {
          DEFAULT: "#FF6D75",
          light: "#FF8A90",
          dark: "#E55A62",
        },
        violet: {
          DEFAULT: "#7C60FD",
          light: "#9D87FF",
          dark: "#6349E0",
        },
        // Primary - using coral as primary
        primary: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4ab",
          400: "#ff8a90",
          500: "#FF6D75",
          600: "#e55a62",
          700: "#c14851",
          800: "#9f3d44",
          900: "#83363d",
          950: "#4a1a1e",
        },
        // Accent colors - Violet/Purple
        accent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#9D87FF",
          500: "#7C60FD",
          600: "#6349E0",
          700: "#5137c4",
          800: "#432da0",
          900: "#382983",
          950: "#221863",
        },
        // Brand red
        brand: {
          red: "#F72349",
          yellow: "#FEEA46",
          green: "#4BE15A",
          disable: "#994146",
        },
        // NFT badge colors
        nft: {
          gold: "#fbbf24",
          silver: "#9ca3af",
          bronze: "#f59e0b",
          platinum: "#e5e7eb",
        },
        // Dark theme colors - updated for new BG gradient
        dark: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1D212B",
          900: "#292347",
          950: "#151821",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Main gradient from Figma
        "main-gradient":
          "linear-gradient(139.84deg, #FF6D75 50%, #9C86FF 96.42%)",
        // Background gradient
        "bg-gradient":
          "linear-gradient(109.28deg, #1D212B 12.96%, #292347 87.04%)",
        // Web3/NFT gradients
        "web3-gradient": "linear-gradient(135deg, #FF6D75 0%, #7C60FD 100%)",
        "nft-gradient": "linear-gradient(135deg, #FF6D75 0%, #9D87FF 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,109,117,0.1) 0%, rgba(124,96,253,0.1) 100%)",
        // Button gradients
        "coral-gradient":
          "linear-gradient(139.84deg, #FF6D75 50%, #9C86FF 96.42%)",
        "violet-gradient": "linear-gradient(135deg, #9D87FF 0%, #7C60FD 100%)",
      },
      animation: {
        glow: "glow 2s ease-in-out infinite alternate",
        "glow-coral": "glow-coral 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(124, 96, 253, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(124, 96, 253, 0.8)" },
        },
        "glow-coral": {
          "0%": { boxShadow: "0 0 20px rgba(255, 109, 117, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(255, 109, 117, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        neon: "0 0 5px rgba(124, 96, 253, 0.5), 0 0 20px rgba(124, 96, 253, 0.3)",
        "neon-lg":
          "0 0 10px rgba(124, 96, 253, 0.5), 0 0 40px rgba(124, 96, 253, 0.3)",
        "neon-coral":
          "0 0 5px rgba(255, 109, 117, 0.5), 0 0 20px rgba(255, 109, 117, 0.3)",
        "neon-coral-lg":
          "0 0 10px rgba(255, 109, 117, 0.5), 0 0 40px rgba(255, 109, 117, 0.3)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
