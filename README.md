# VeTerex

A decentralized platform for tracking and verifying media consumption achievements using non-transferable NFTs.

## Project Structure

```
VeTerex/
├── frontend/          # Chrome Extension & Web App (React + TypeScript)
├── backend/           # API Server (TBD)
└── smart-contract/    # Solidity Smart Contracts (TBD)
```

## Frontend (Chrome Extension)

The frontend is built as a Chrome Extension with modern web technologies:

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State Management
- **Wepin SDK** - Web3 Wallet Integration

### Features

- 🎬 Track media consumption (Books, Movies, Anime, Manga, TV Shows)
- 🎖️ Mint soulbound NFTs as proof of completion
- 👥 Connect with users who share the same achievements
- 🔐 Secure wallet integration via Wepin
- 🌐 Works as Chrome Extension or Web App

### Getting Started

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Wepin credentials
   ```

3. **Development Mode (Web)**
   ```bash
   npm run dev
   ```

4. **Build Extension**
   ```bash
   npm run build:extension
   ```

5. **Load Extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-extension` folder

### Configuration

Get your API keys from:
- **Wepin**: https://workspace.wepin.io/
- **VeryChat API**: https://developers.verylabs.io/

### Project Documentation

- [Wepin SDK Docs](https://docs.wepin.io/en)
- [VeryChat API Docs](https://developers.verylabs.io/)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| State | Zustand |
| Web3 | Wepin SDK |
| API | VeryChat API |
| Extension | Chrome Extension Manifest V3 |

## NFT Features

- **Soulbound Tokens**: Non-transferable NFTs that prove genuine completion
- **Media Types**: Books, Movies, Anime, Manga, Comics, TV Shows
- **Rarity System**: Common, Uncommon, Rare, Epic, Legendary
- **Social Features**: Users with matching NFTs can discover each other

## Community

Join groups based on completed media and connect with others who share your interests!

## License

MIT
