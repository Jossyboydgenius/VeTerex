import type { MediaItem, MediaType, CompletionNFT, Group } from '@/types'

// VeryChat API Configuration
const VERY_API_BASE = 'https://gapi.veryapi.io'
const PROJECT_ID = import.meta.env.VITE_VERY_PROJECT_ID || 'veterex-hackathon'

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${VERY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Project-Id': PROJECT_ID,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }
  
  return response.json()
}

// ==================
// Media API
// ==================

/**
 * Get all media items with optional filters
 */
export async function getMediaItems(params?: {
  type?: MediaType
  search?: string
  page?: number
  limit?: number
}): Promise<{ items: MediaItem[]; total: number }> {
  const queryParams = new URLSearchParams()
  if (params?.type) queryParams.append('type', params.type)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const query = queryParams.toString()
  return apiRequest(`/media${query ? `?${query}` : ''}`)
}

/**
 * Get single media item by ID
 */
export async function getMediaById(id: string): Promise<MediaItem> {
  return apiRequest(`/media/${id}`)
}

/**
 * Search media by external ID (ISBN, IMDB, etc.)
 */
export async function searchMediaByExternalId(
  externalId: string,
  type?: MediaType
): Promise<MediaItem | null> {
  try {
    const params = new URLSearchParams({ externalId })
    if (type) params.append('type', type)
    return apiRequest(`/media/search?${params}`)
  } catch {
    return null
  }
}

// ==================
// NFT / Completion API
// ==================

/**
 * Mint completion NFT for a media item
 */
export async function mintCompletionNFT(params: {
  mediaId: string
  userAddress: string
  completedAt: Date
  rating?: number
  review?: string
}): Promise<{ tokenId: string; transactionHash: string }> {
  return apiRequest('/nft/mint', {
    method: 'POST',
    body: JSON.stringify({
      mediaId: params.mediaId,
      userAddress: params.userAddress,
      completedAt: params.completedAt.toISOString(),
      rating: params.rating,
      review: params.review,
    }),
  })
}

/**
 * Get user's completion NFTs
 */
export async function getUserCompletions(
  userAddress: string
): Promise<CompletionNFT[]> {
  return apiRequest(`/nft/user/${userAddress}`)
}

/**
 * Check if user has completed a media item
 */
export async function hasUserCompleted(
  userAddress: string,
  mediaId: string
): Promise<boolean> {
  try {
    const result = await apiRequest<{ completed: boolean }>(
      `/nft/check/${userAddress}/${mediaId}`
    )
    return result.completed
  } catch {
    return false
  }
}

/**
 * Get completion count for a media item
 */
export async function getMediaCompletionCount(mediaId: string): Promise<number> {
  const result = await apiRequest<{ count: number }>(`/media/${mediaId}/completions`)
  return result.count
}

// ==================
// Social / Groups API
// ==================

/**
 * Get groups for a media item
 */
export async function getMediaGroups(mediaId: string): Promise<Group[]> {
  return apiRequest(`/groups/media/${mediaId}`)
}

/**
 * Get groups user is part of
 */
export async function getUserGroups(userAddress: string): Promise<Group[]> {
  return apiRequest(`/groups/user/${userAddress}`)
}

/**
 * Join a group (requires completion NFT)
 */
export async function joinGroup(
  groupId: string,
  userAddress: string
): Promise<{ success: boolean }> {
  return apiRequest(`/groups/${groupId}/join`, {
    method: 'POST',
    body: JSON.stringify({ userAddress }),
  })
}

/**
 * Get users with matching NFTs (for social discovery)
 */
export async function getMatchingUsers(
  userAddress: string
): Promise<{ users: any[]; commonMedia: MediaItem[] }> {
  return apiRequest(`/social/matches/${userAddress}`)
}

// ==================
// Leaderboard API
// ==================

/**
 * Get top completers leaderboard
 */
export async function getLeaderboard(params?: {
  type?: MediaType
  timeframe?: 'week' | 'month' | 'all'
  limit?: number
}): Promise<{ users: any[]; rank: number }[]> {
  const queryParams = new URLSearchParams()
  if (params?.type) queryParams.append('type', params.type)
  if (params?.timeframe) queryParams.append('timeframe', params.timeframe)
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  
  const query = queryParams.toString()
  return apiRequest(`/leaderboard${query ? `?${query}` : ''}`)
}
