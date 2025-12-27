import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Book,
  Film,
  Tv,
  BookOpen,
  ArrowRight,
  Award,
  Users,
  TrendingUp,
  Play,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const mediaTypes = [
  {
    type: "book",
    icon: Book,
    label: "Books",
    color: "from-emerald-500 to-green-600",
  },
  {
    type: "movie",
    icon: Film,
    label: "Movies",
    color: "from-red-500 to-rose-600",
  },
  {
    type: "anime",
    icon: Play,
    label: "Anime",
    color: "from-pink-500 to-fuchsia-600",
  },
  {
    type: "manga",
    icon: BookOpen,
    label: "Manga",
    color: "from-orange-500 to-amber-600",
  },
  {
    type: "tvshow",
    icon: Tv,
    label: "TV Shows",
    color: "from-blue-500 to-indigo-600",
  },
  {
    type: "series",
    icon: Film,
    label: "Series",
    color: "from-violet-500 to-purple-600",
  },
];

const stats = [
  { icon: Award, value: "12,450", label: "NFTs Minted" },
  { icon: Users, value: "3,200", label: "Active Users" },
  { icon: TrendingUp, value: "85K", label: "Completions" },
];

// Stats section temporarily disabled
const SHOW_STATS = false;

export function HomePage() {
  const { isConnected, completions } = useAppStore();

  return (
    <div className="px-4 py-6 space-y-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-6"
        >
          <img
            src="/icons/icon.svg"
            alt="VeTerex Logo"
            className="w-full h-full"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-display font-bold gradient-text mb-3"
        >
          Track Your Media Journey
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-dark-400 text-sm max-w-xs mx-auto mb-6"
        >
          Earn verified NFT badges for every book, movie, anime, and show you
          complete. Connect with others who share your achievements.
        </motion.p>

        {!isConnected ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-accent-400"
          >
            Connect your wallet to start tracking
          </motion.p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 text-sm text-green-400"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Wallet Connected</span>
          </motion.div>
        )}
      </motion.section>

      {/* Stats - Temporarily disabled */}
      {SHOW_STATS && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map(({ icon: Icon, value, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="card text-center py-4"
            >
              <Icon className="w-5 h-5 mx-auto text-accent-400 mb-2" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-dark-400">{label}</p>
            </motion.div>
          ))}
        </motion.section>
      )}

      {/* Media Types Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Explore by Type</h2>
          <Link
            to="/explore"
            className="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
          >
            <span>See all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mediaTypes.map(({ type, icon: Icon, label, color }, index) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Link to={`/explore?type=${type}`} className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-2xl bg-gradient-to-br ${color}
                    relative overflow-hidden group
                  `}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10">
                    <Icon className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-white">{label}</p>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Your Progress (if connected) */}
      {isConnected && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Progress</h2>
            <Link
              to="/collection"
              className="flex items-center gap-1 text-sm text-accent-400 hover:text-accent-300"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 
                            flex items-center justify-center border border-accent-500/30"
              >
                <Award className="w-7 h-7 text-accent-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">
                  {completions.length}
                </p>
                <p className="text-sm text-dark-400">NFTs in your collection</p>
              </div>
              <Link to="/explore" className="btn-primary text-sm py-2 px-4">
                Add More
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

        <Link to="/explore">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="card flex items-center gap-4 hover:border-accent-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Record a Completion</p>
              <p className="text-xs text-dark-400">
                Mark a book, movie, or show as completed
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-dark-500" />
          </motion.div>
        </Link>

        <Link to="/community">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="card flex items-center gap-4 hover:border-accent-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Find Your Community</p>
              <p className="text-xs text-dark-400">
                Connect with others who share your interests
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-dark-500" />
          </motion.div>
        </Link>
      </motion.section>
    </div>
  );
}
