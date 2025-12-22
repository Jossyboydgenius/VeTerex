# VeTerex Smart Contract

This folder will contain the Solidity smart contracts for the VeTerex platform.

## Planned Contracts

### VeTerexNFT.sol
- Soulbound (non-transferable) NFT implementation
- ERC-721 base with transfer restrictions
- Completion metadata storage

### MediaRegistry.sol
- Media item registration
- External ID mapping (ISBN, IMDB, MAL)
- Authorized registrar management

### GroupManager.sol
- Social groups for NFT holders
- Auto-discovery of matching users
- Group membership verification

## Development

```bash
# Install dependencies (when implemented)
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy
npm run deploy
```

## Security

- Non-transferable tokens (soulbound)
- Authorized registrar system
- On-chain verification
