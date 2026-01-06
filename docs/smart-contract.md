# Smart contract

The VeTerex smart contract is the core of the platform, managing media registrations, completion NFTs, and community features.

## Contract Overview

| Property           | Details                    |
| ------------------ | -------------------------- |
| **Contract Name**  | VeTerex                    |
| **Token Standard** | ERC-721 (Soulbound)        |
| **Blockchain**     | Verychain (Chain ID: 4613) |
| **Upgradeability** | UUPS Proxy Pattern         |

## Key Features

### 🎖️ Soulbound NFTs

VeTerex NFTs are **non-transferable** (soulbound):

{% code title="Soulbound overrides" %}
```solidity
// Transfers are blocked
function approve(address, uint256) public pure override {
    revert NonTransferable();
}

function setApprovalForAll(address, bool) public pure override {
    revert NonTransferable();
}
```
{% endcode %}

This ensures your achievements stay with your wallet forever.

### 📚 Media Types

The contract supports six media types:

| Type  | Code | Description          |
| ----- | ---- | -------------------- |
| Book  | 1    | Books, E-books       |
| Movie | 2    | Films, Documentaries |
| Anime | 3    | Japanese animation   |
| Comic | 4    | Graphic novels       |
| Manga | 5    | Japanese comics      |
| Show  | 6    | TV Series            |

### 🎯 Core Functions

#### Completing Media

When you complete a piece of media, an NFT is minted to your wallet:

{% code title="completeAndRegisterByExternalId" %}
```
completeAndRegisterByExternalId(
    to,      // Your wallet address
    kind,    // Media type (Book, Movie, etc.)
    uri,     // Media identifier
    name     // Media title
)
```
{% endcode %}

#### Checking Completions

{% code title="hasCompleted" %}
```
hasCompleted(user, mediaId) → bool
```
{% endcode %}

Returns whether a user has completed specific media.

#### Your NFT Collection

{% code title="userTokenIds" %}
```
userTokenIds(user) → uint256[]
```
{% endcode %}

Returns all NFT token IDs owned by a user.

### 👥 Community Features

#### Joining Groups

{% code title="Group membership" %}
```
joinGroup(mediaId)  // Join a media's community group
leaveGroup(mediaId) // Leave a group
```
{% endcode %}

#### Finding Similar Users

{% code title="getsimilars" %}
```
getsimilars(user, nftIds) → address[]
```
{% endcode %}

Find other users who have completed the same media as you.

#### Messaging Requirements

{% code title="canText" %}
```
canText(from, to, mediaId) → bool
```
{% endcode %}

Check if two users can message each other (both must have completed the same media).

### 🔥 Burning NFTs

You can remove achievements from your collection:

{% code title="burn" %}
```
burn(tokenId)
```
{% endcode %}

This permanently destroys the NFT and removes you from related groups.

## Events

The contract emits events for key actions:

| Event             | When Emitted                        |
| ----------------- | ----------------------------------- |
| `MediaRegistered` | New media is registered             |
| `MediaCompleted`  | User completes media & receives NFT |
| `GroupJoined`     | User joins a media group            |
| `GroupLeft`       | User leaves a media group           |

## Security

{% hint style="info" %}
Access control and verification details:

* Only the authorized backend can mint completion NFTs.
* Contract owner manages registrars and settings.
* UUPS upgrade mechanism is owner-controlled.
{% endhint %}

### Why Backend Verification?

To prevent fraud, completions must be verified by the VeTerex backend before minting. This ensures:

* ✅ Genuine completions only
* ✅ No fake achievements
* ✅ Trustworthy community
