# VeTerex Backend

This folder will contain the backend API server for the VeTerex platform.

## Planned Features

- RESTful API for media data
- NFT minting coordination
- User profile management
- Social features (groups, matching)
- External API integration (IMDB, MAL, Google Books)

## Tech Stack (Planned)

- Node.js / Express or Fastify
- PostgreSQL for relational data
- Redis for caching
- Integration with blockchain nodes

## API Endpoints (Planned)

```
GET    /api/media           - List media items
GET    /api/media/:id       - Get media details
POST   /api/media/search    - Search media
GET    /api/nft/user/:addr  - Get user's NFTs
POST   /api/nft/mint        - Initiate NFT mint
GET    /api/groups          - List groups
GET    /api/social/matches  - Find matching users
```

## Development

```bash
# Install dependencies (when implemented)
npm install

# Start development server
npm run dev

# Run tests
npm run test
```
