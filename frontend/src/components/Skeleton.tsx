import { motion } from "framer-motion";

// Base skeleton component with shimmer effect
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`bg-dark-700 animate-pulse rounded ${className}`} />;
}

// Skeleton for group/media cards in lists
interface GroupCardSkeletonProps {
  count?: number;
}

export function GroupCardSkeleton({ count = 1 }: GroupCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 animate-pulse">
          {/* Media Cover Skeleton */}
          <div className="w-14 h-20 rounded-lg bg-dark-700 flex-shrink-0" />

          {/* Group Info Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-dark-700 rounded w-1/4" />
            <div className="flex items-center gap-3 mt-2">
              <div className="h-2 bg-dark-700 rounded w-20" />
              <div className="h-2 bg-dark-700 rounded w-12" />
            </div>
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-dark-700 rounded-lg" />
            <div className="w-5 h-5 bg-dark-700 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

// Skeleton for match user cards
interface MatchCardSkeletonProps {
  count?: number;
}

export function MatchCardSkeleton({ count = 1 }: MatchCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 animate-pulse">
          {/* Avatar Skeleton */}
          <div className="w-12 h-12 rounded-xl bg-dark-700" />

          {/* User Info Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-700 rounded w-2/3" />
            <div className="h-3 bg-dark-700 rounded w-1/3" />
          </div>

          {/* Action Button Skeleton */}
          <div className="w-10 h-10 bg-dark-700 rounded-lg" />
        </div>
      ))}
    </>
  );
}

// Skeleton for group detail page header
export function GroupDetailHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Cover Image */}
      <div className="relative h-48 bg-dark-700">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
      </div>

      {/* Group Info */}
      <div className="px-4 pb-4 -mt-20 relative">
        <div className="flex items-end gap-4">
          <div className="w-24 h-32 rounded-xl bg-dark-700 border-4 border-dark-900" />
          <div className="flex-1 pb-2 space-y-2">
            <div className="h-6 bg-dark-700 rounded w-48" />
            <div className="h-4 bg-dark-700 rounded w-24" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="h-4 bg-dark-700 rounded w-24" />
          <div className="h-4 bg-dark-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for discussion posts
interface PostSkeletonProps {
  count?: number;
}

export function PostSkeleton({ count = 1 }: PostSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dark-700" />
            <div className="space-y-1">
              <div className="h-4 bg-dark-700 rounded w-24" />
              <div className="h-3 bg-dark-700 rounded w-16" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 bg-dark-700 rounded w-full" />
            <div className="h-4 bg-dark-700 rounded w-5/6" />
            <div className="h-4 bg-dark-700 rounded w-3/4" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="h-4 bg-dark-700 rounded w-12" />
            <div className="h-4 bg-dark-700 rounded w-12" />
          </div>
        </div>
      ))}
    </>
  );
}

// Skeleton for member list
interface MemberSkeletonProps {
  count?: number;
}

export function MemberSkeleton({ count = 1 }: MemberSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-dark-700" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-dark-700 rounded w-32" />
            <div className="h-3 bg-dark-700 rounded w-20" />
          </div>
          <div className="w-8 h-8 bg-dark-700 rounded-lg" />
        </div>
      ))}
    </>
  );
}

// Skeleton for stats cards
interface StatsSkeletonProps {
  count?: number;
}

export function StatsSkeleton({ count = 3 }: StatsSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card text-center py-3 animate-pulse">
          <div className="w-5 h-5 mx-auto bg-dark-700 rounded mb-1" />
          <div className="h-6 bg-dark-700 rounded w-8 mx-auto mb-1" />
          <div className="h-3 bg-dark-700 rounded w-12 mx-auto" />
        </div>
      ))}
    </>
  );
}

// Full page loading spinner
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        className="w-12 h-12 border-3 border-dark-700 border-t-coral rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-dark-400 mt-4 text-sm">Loading...</p>
    </div>
  );
}

// Inline loading spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-dark-700 border-t-coral rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Channel card skeleton
interface ChannelSkeletonProps {
  count?: number;
}

export function ChannelSkeleton({ count = 1 }: ChannelSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-dark-800 rounded-xl p-3 flex items-center gap-4 animate-pulse border border-dark-700"
        >
          <div className="w-12 h-12 rounded-xl bg-dark-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-3 bg-dark-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
