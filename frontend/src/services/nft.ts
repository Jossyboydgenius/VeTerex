import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { wagmiConfig } from "./wagmi";
import { VETEREX_CONTRACT, VETEREX_ABI } from "./contract";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

export type HexAddress = `0x${string}`;

export function mapMediaKind(
  kind: number
): "book" | "movie" | "anime" | "comic" | "manga" | "tvshow" | "unknown" {
  if (kind === 1) return "book";
  if (kind === 2) return "movie";
  if (kind === 3) return "anime";
  if (kind === 4) return "comic";
  if (kind === 5) return "manga";
  if (kind === 6) return "tvshow";
  return "unknown";
}

export function mapTrackedType(type: string): number {
  if (type === "book") return 1;
  if (type === "movie") return 2;
  if (type === "anime") return 3;
  if (type === "comic") return 4;
  if (type === "manga") return 5;
  if (type === "tvshow") return 6;
  return 0;
}

export async function readUserNfts(user: HexAddress): Promise<bigint[]> {
  const ids = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "getusernft",
    args: [user],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return ids as unknown as bigint[];
}

export async function getTokensMetadata(tokenIds: bigint[]) {
  if (tokenIds.length === 0) return [];

  // Use Promise.all with individual readContract calls instead of multicall
  // because the current chain might not support Multicall3
  const promises = tokenIds.map(async (id) => {
    try {
      const [tokenURI, mediaId] = await Promise.all([
        readContract(wagmiConfig, {
          address: VETEREX_CONTRACT.address as HexAddress,
          abi: VETEREX_ABI,
          functionName: "tokenURI",
          args: [id],
          chainId: VETEREX_CONTRACT.chainId,
        }) as Promise<string>,
        readContract(wagmiConfig, {
          address: VETEREX_CONTRACT.address as HexAddress,
          abi: VETEREX_ABI,
          functionName: "tokenMediaId",
          args: [id],
          chainId: VETEREX_CONTRACT.chainId,
        }) as Promise<`0x${string}`>,
      ]);

      const info = (await readContract(wagmiConfig, {
        address: VETEREX_CONTRACT.address as HexAddress,
        abi: VETEREX_ABI,
        functionName: "mediaInfo",
        args: [mediaId],
        chainId: VETEREX_CONTRACT.chainId,
      })) as [boolean, number, string];

      return {
        tokenId: id,
        tokenURI,
        mediaId,
        kind: info[1],
        uri: info[2],
      };
    } catch (error) {
      console.error(`Failed to fetch metadata for token ${id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

export async function getSimilars(
  user: HexAddress,
  tokenIds: bigint[]
): Promise<HexAddress[]> {
  const res = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "getsimilars",
    args: [user, tokenIds],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return res as unknown as HexAddress[];
}

export async function mintCompletion(
  to: HexAddress,
  kind: number,
  uri: string,
  name: string
) {
  const pk = (
    import.meta.env.VITE_BACKEND_PRIVATE_KEY ||
    import.meta.env.BACKEND_PRIVATE_KEY ||
    ""
  ).trim();
  if (!pk) throw new Error("Missing backend private key");

  // Format private key correctly - must be 32 bytes hex
  const formattedPk = pk.startsWith("0x") ? pk : `0x${pk}`;
  const account = privateKeyToAccount(formattedPk as `0x${string}`);

  const hash = await writeContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "completeAndRegisterByExternalId",
    args: [to, kind, uri, name],
    chainId: VETEREX_CONTRACT.chainId,
    account,
  });
  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: VETEREX_CONTRACT.chainId,
  });
  return { hash, receipt };
}

export async function getGroupMemberCount(mediaId: Hex): Promise<bigint> {
  const count = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "groupMemberCount",
    args: [mediaId],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return count as unknown as bigint;
}

export async function getGroupMemberAt(
  mediaId: Hex,
  index: bigint
): Promise<HexAddress> {
  const addr = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "groupMemberAt",
    args: [mediaId, index],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return addr as unknown as HexAddress;
}

export async function mediaInfo(
  mediaId: Hex
): Promise<[boolean, number, string]> {
  const info = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "mediaInfo",
    args: [mediaId],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return info as unknown as [boolean, number, string];
}

export async function tokenMediaId(tokenId: bigint): Promise<Hex> {
  const mid = await readContract(wagmiConfig, {
    address: VETEREX_CONTRACT.address as HexAddress,
    abi: VETEREX_ABI,
    functionName: "tokenMediaId",
    args: [tokenId],
    chainId: VETEREX_CONTRACT.chainId,
  });
  return mid as unknown as Hex;
}

export async function getUserNFTCount(
  userAddress: HexAddress
): Promise<number> {
  try {
    const nfts = await readUserNfts(userAddress);
    return nfts.length;
  } catch (error) {
    console.error("[NFT] Error getting user NFT count:", error);
    return 0;
  }
}
