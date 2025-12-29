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


Deployed to Verychain (4613)

- Implementation (VeTerex): 0x63a2fB46b32CDF7DB176dd59d91Ef89D23E859d1 (tx 0x279e1946f10d4cfbb952d2a2e5639ba0e0d3aa22b6e06c16e4c309db07cc52fd , status 1)
- Proxy (ERC1967Proxy / your live address): 0xDba4B629FA01436E0f6849B54B4744ef65a53FDa (tx 0xac13f798f79908825ed752488f6b13bc75633748cec1bcfa23fe652f86e7a5b9 , status 1)
- Total paid: 0.003896178 VERY @ 1 gwei (3,896,178 gas)