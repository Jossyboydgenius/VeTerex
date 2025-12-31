## Overview
- Wire the React frontend to the VeTerex UUPS proxy on Verychain (chainId 4613) using Wagmi + Viem.
- Implement on-chain read and write flows: mint via completeAndRegisterByExternalId (backend-only), fetch user NFTs, and get similar users.
- Replace dummy UI data with on-chain results across Mint, Collection, and Community pages.

## Prerequisites
- Add dependencies: wagmi, viem, @tanstack/react-query.
- Ensure env exposes backend signer for minting (unsafe in public clients, but following your directive):
  - VITE_BACKEND_PRIVATE_KEY
  - VITE_BACKEND_ADDRESS
- Use Verychain RPC: https://rpc.verylabs.io and the existing proxy address from services/contract.ts.

## Wagmi Configuration
- Create src/services/wagmi.ts:
  - Define Verychain via defineChain({ id: 4613, name: 'Verychain', nativeCurrency: { name: 'VERY', symbol: 'VERY', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.verylabs.io'] } }, blockExplorers: { default: { name: 'Veryscan', url: 'https://veryscan.io' } } }).
  - export const config = createConfig({ chains: [verychain], transports: { 4613: http('https://rpc.verylabs.io') } }).
  - Provide helpers for public client and typed contract actions.
- In src/main.tsx wrap the app:
  - <WagmiProvider config={config}><QueryClientProvider client={qc}><App/></QueryClientProvider></WagmiProvider> following Wagmi docs.

## Contract Helpers
- Use the existing ABI and addresses in [contract.ts](file:///Users/dreytech/Projects/VeTerex/frontend/src/services/contract.ts).
- Build src/services/nft.ts with:
  - readUserNfts(address): calls getusernft or userTokenIds
  - readTokenURI(tokenId) and tokenMediaId(tokenId) → mediaInfo(mediaId)
  - getSimilars(user, tokenIds): calls getsimilars
  - mapMediaKind(uint8 → 'book' | 'movie' | 'anime' | 'comic' | 'manga' | 'tvshow')
  - mapTrackedType('video'→Unknown, 'movie'→Movie, 'tvshow'→Show, etc.)
- For batch reads, use Viem multicall to fetch tokenURI, tokenMediaId, and mediaInfo efficiently.

## Mint Flow (Backend-only signer)
- In [MintPage.tsx](file:///Users/dreytech/Projects/VeTerex/frontend/src/pages/MintPage.tsx):
  - Replace the simulated handleMint with a real call:
    - Resolve the recipient: currentAccount.address from the store.
    - Build args: kind (mapped enum), uri (tracked media URL or external ID), name (media title).
    - Create an account from private key: privateKeyToAccount(VITE_BACKEND_PRIVATE_KEY).
    - Call writeContract(config, { address: VETEREX_PROXY_ADDRESS, abi: VETEREX_ABI, functionName: 'completeAndRegisterByExternalId', args, chainId: 4613, account }).
    - Wait for confirmation: useWaitForTransactionReceipt or viem wait.
    - On success, show toast and refresh the user’s collection from chain.
  - Security note: this exposes a privileged key client-side; under your directive we implement it, but recommend migrating to a backend API signer later.

## Collection Page: Replace Dummy Data
- In [CollectionPage.tsx](file:///Users/dreytech/Projects/VeTerex/frontend/src/pages/CollectionPage.tsx):
  - On mount when isConnected, load completions via readUserNfts(userAddr).
  - For each tokenId:
    - Fetch tokenURI and tokenMediaId → mediaInfo to get kind + uri.
    - Construct CompletionNFT: id/tokenId/mediaId, media fields (type from kind, coverImage from tokenURI, title from uri or name if present later), mintedAt from event or fallback now, transactionHash if captured.
  - Store completions in zustand via setCompletions; stop using mockNFTs.

## Community Matches: getsimilars
- In [CommunityPage.tsx](file:///Users/dreytech/Projects/VeTerex/frontend/src/pages/CommunityPage.tsx):
  - When activeTab==='matches' and connected:
    - Get the user’s token IDs; call getsimilars(userAddr, tokenIds).
    - Display returned addresses with basic identity (address short form); later enrich via VeryChat if available.
  - Remove mockMatchingUsers.

## Optional: Groups (join/leave)
- Wire read-only counts initially:
  - groupMemberCount(mediaId) and groupMemberAt(mediaId, i) to show real membership sizes.
- Defer joinGroup/leaveGroup signing until wallet connector integration (Wepin/EIP-1193 bridge), since these are user-signed.

## MediaKind Mapping
- Contract enum in [trex.sol](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L13-L21): Unknown=0, Book=1, Movie=2, Anime=3, Comic=4, Manga=5, Show=6.
- Map tracked types:
  - 'book'→1, 'movie'→2, 'anime'→3, 'comic'→4, 'manga'→5, 'tvshow'→6, 'video'→0.

## Verification
- Use on-chain reads to verify:
  - After mint, read completionTokenId(user, computeMediaId(kind, uri, name)) or refresh userTokenIds(user) to confirm the new token.
  - Display tokenURI results in Collection Page.
  - Validate getsimilars returns at least 0..N addresses based on tests in [VeryMediaCompletion.t.sol](file:///Users/dreytech/Projects/VeTerex/smart-contract/test/VeryMediaCompletion.t.sol#L121-L198).

## References
- Mint API in contract: [completeAndRegisterByExternalId](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L111-L123)
- User NFTs: [getusernft](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L306-L308) and [userTokenIds](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L161-L163)
- Similar users: [getsimilars](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L310-L351)
- UUPS upgrade helpers: [upgradeTo](file:///Users/dreytech/Projects/VeTerex/smart-contract/src/trex.sol#L259-L261) (not needed for reads/writes)

## Next Steps
- I’ll add the Wagmi provider, contract helpers, and replace the simulated flows in Mint/Collection/Community with real on-chain calls.
- Confirm env keys and Verychain RPC are present; if not, I’ll add the variables and use defaults from docs.

Please confirm, and I’ll implement these changes end-to-end.