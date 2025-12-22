import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home, Search, ArrowLeft, Sparkles } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8 text-center">
      {/* Animated 404 Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center border border-accent-500/30">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-16 h-16 text-accent-400" />
          </motion.div>
        </div>
        {/* Floating particles */}
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent-500"
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-primary-500"
          animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Error Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-8"
      >
        <h1 className="text-6xl font-bold gradient-text">404</h1>
        <h2 className="text-xl font-semibold text-white">Page Not Found</h2>
        <p className="text-dark-400 max-w-sm">
          Oops! The page you're looking for doesn't exist or has been moved to
          another dimension.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
      >
        <button
          onClick={() => navigate("/")}
          className="btn-primary flex items-center justify-center gap-2 flex-1"
        >
          <Home className="w-4 h-4" />
          <span>Go Home</span>
        </button>
        <button
          onClick={() => navigate("/explore")}
          className="btn-secondary flex items-center justify-center gap-2 flex-1"
        >
          <Search className="w-4 h-4" />
          <span>Explore</span>
        </button>
      </motion.div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => navigate(-1)}
        className="mt-6 flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Go back</span>
      </motion.button>
    </div>
  );
}
