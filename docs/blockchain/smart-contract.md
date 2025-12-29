# Smart Contract

The VeTerex smart contract is the core of the platform, managing media registrations, completion NFTs, and community features.

## Contract Overview

| Property | Details |
|----------|---------|
| **Contract Name** | VeTerex |
| **Token Standard** | ERC-721 (Soulbound) |
| **Blockchain** | Verychain (Chain ID: 4613) |
| **Upgradeability** | UUPS Proxy Pattern |

## Key Features

### 🎖️ Soulbound NFTs

VeTerex NFTs are **non-transferable** (soulbound):

```solidity
// Transfers are blocked
function approve(address, uint256) public pure override {
    revert NonTransferable();
}

function setApprovalForAll(address, bool) public pure override {
    revert NonTransferable();
}
```

This ensures your achievements stay with your wallet forever.

### 📚 Media Types

The contract supports six media types:

| Type | Code | Description |
|------|------|-------------|
| Book | 1 | Books, E-books |
| Movie | 2 | Films, Documentaries |
| Anime | 3 | Japanese animation |
| Comic | 4 | Graphic novels |
| Manga | 5 | Japanese comics |
| Show | 6 | TV Series |

### 🎯 Core Functions

#### Completing Media
When you complete a piece of media, an NFT is minted to your wallet:

```
completeAndRegisterByExternalId(
    to,      // Your wallet address
    kind,    // Media type (Book, Movie, etc.)
    uri,     // Media identifier
    name     // Media title
)
```

#### Checking Completions
```
hasCompleted(user, mediaId) → bool
```
Returns whether a user has completed specific media.

#### Your NFT Collection
```
userTokenIds(user) → uint256[]
```
Returns all NFT token IDs owned by a user.

### 👥 Community Features

#### Joining Groups
Users who have completed the same media can join groups:

```
joinGroup(mediaId)  // Join a media's community group
leaveGroup(mediaId) // Leave a group
```

#### Finding Similar Users
```
getsimilars(user, nftIds) → address[]
```
Find other users who have completed the same media as you.

#### Messaging Requirements
```
canText(from, to, mediaId) → bool
```
Check if two users can message each other (both must have completed the same media).

### 🔥 Burning NFTs

You can remove achievements from your collection:

```
burn(tokenId)
```
This permanently destroys the NFT and removes you from related groups.

## Events

The contract emits events for key actions:

| Event | When Emitted |
|-------|--------------|
| `MediaRegistered` | New media is registered |
| `MediaCompleted` | User completes media & receives NFT |
| `GroupJoined` | User joins a media group |
| `GroupLeft` | User leaves a media group |

## Security

### Access Control
- **Backend Only** - Only the authorized backend can mint completion NFTs
- **Owner Functions** - Contract owner manages registrars and settings
- **UUPS Upgrades** - Owner-controlled upgrade mechanism

### Why Backend Verification?
To prevent fraud, completions must be verified by the VeTerex backend before minting. This ensures:
- ✅ Genuine completions only
- ✅ No fake achievements
- ✅ Trustworthy community

---

**Next:** [Download VeryChat →](../getting-started/download-verychat.md)
