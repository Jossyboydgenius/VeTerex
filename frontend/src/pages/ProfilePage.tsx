import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  LogOut,
  Copy,
  Check,
  Award,
  Calendar,
  ExternalLink,
  Edit3,
  Book,
  Film,
  Tv,
  Play,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  logoutWepin,
  initWepin,
  loginWithWepin,
  getWepinAccounts,
} from "@/services/wepin";
import { logout as logoutVeryChat } from "@/services/verychat";

const statIcons = {
  book: Book,
  movie: Film,
  anime: Play,
  manga: BookOpen,
  tvshow: Tv,
};

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    isConnected,
    authMethod,
    currentAccount,
    wepinUser,
    verychatUser,
    joinedAt,
    completions,
    setConnected,
    setLoading,
    setWepinUser,
    setAccounts,
    setCurrentAccount,
    addToast,
    logout,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get display name based on auth method
  const displayName =
    authMethod === "verychat" && verychatUser
      ? verychatUser.profileName
      : wepinUser?.userInfo?.email?.split("@")[0] || "Anonymous User";

  // Get profile ID for display
  const profileId =
    authMethod === "verychat" && verychatUser
      ? `@${verychatUser.profileId}`
      : currentAccount?.address
      ? `${currentAccount.address.slice(0, 8)}...${currentAccount.address.slice(
          -6
        )}`
      : null;

  // Format join date
  const formatJoinDate = (dateString: string | null) => {
    if (!dateString) return "Recently joined";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setLoading(true);
    try {
      // Initialize Wepin SDK
      await initWepin();

      // Login with Wepin Widget
      const user = await loginWithWepin();

      if (user?.status === "success") {
        setWepinUser(user);

        // Get accounts
        const accounts = await getWepinAccounts();
        setAccounts(accounts);

        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }

        setConnected(true);
        addToast({
          type: "success",
          message: "Wallet connected successfully!",
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      addToast({
        type: "error",
        message: "Failed to connect wallet. Please try again.",
      });
    } finally {
      setIsConnecting(false);
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: "error",
        message: "Please select an image file (JPEG, PNG, WebP, or GIF)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: "error",
        message: "Image size must be less than 5MB",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Upload to backend when API is ready
      // For now, just show the local preview
      // const formData = new FormData();
      // formData.append("file", file);
      // const response = await fetch(`${API_URL}/api/user/upload-image/${userId}`, {
      //   method: "POST",
      //   body: formData,
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setLocalProfileImage(data.imageUrl);
      // }

      addToast({
        type: "success",
        message: "Profile image updated!",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      addToast({
        type: "error",
        message: "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Trigger file input click
  const handleEditImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = async () => {
    try {
      if (authMethod === "wepin") {
        await logoutWepin();
      } else if (authMethod === "verychat") {
        logoutVeryChat();
      }
      logout();
      addToast({ type: "info", message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate stats
  const typeStats = completions.reduce((acc, nft) => {
    acc[nft.media.type] = (acc[nft.media.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isConnected) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-coral/20 to-violet/20 flex items-center justify-center border border-coral/30"
            animate={{
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.2)",
                "0 0 40px rgba(168, 85, 247, 0.4)",
                "0 0 20px rgba(168, 85, 247, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <User className="w-12 h-12 text-coral" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-3">
            Your Profile
          </h2>
          <p className="text-dark-400 max-w-xs mx-auto mb-8">
            Connect your wallet to view your profile, achievements, and manage
            your account settings.
          </p>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-xs mx-auto">
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">NFTs</p>
            </div>
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">Groups</p>
            </div>
            <div className="card py-4 opacity-60">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-dark-400">Friends</p>
            </div>
          </div>

          <p className="text-sm text-dark-500">
            Sign in with{" "}
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="text-coral font-semibold cursor-pointer hover:text-coral-light transition-colors hover:underline"
            >
              Google
            </button>
            ,{" "}
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="text-coral font-semibold cursor-pointer hover:text-coral-light transition-colors hover:underline"
            >
              Apple
            </button>
            , or{" "}
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="text-coral font-semibold cursor-pointer hover:text-coral-light transition-colors hover:underline"
            >
              Email
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-coral to-violet p-[3px]">
            <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center overflow-hidden">
              {localProfileImage ? (
                <img
                  src={localProfileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : authMethod === "verychat" && verychatUser?.profileImage ? (
                <img
                  src={verychatUser.profileImage}
                  alt={verychatUser.profileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-dark-400" />
              )}
            </div>
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
          {/* Edit button */}
          <button
            onClick={handleEditImageClick}
            disabled={isUploadingImage}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-coral text-white hover:bg-coral-light transition-colors disabled:opacity-50"
          >
            {isUploadingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Info */}
        <h1 className="text-xl font-bold text-white mb-1">{displayName}</h1>

        {/* Profile ID or Wallet Address */}
        {profileId && (
          <div className="flex flex-col items-center gap-1 text-sm text-dark-400 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono">{profileId}</span>
              {authMethod === "wepin" && currentAccount?.address && (
                <button
                  onClick={handleCopyAddress}
                  className="p-1 rounded hover:bg-dark-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-brand-green" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {/* Show wallet address for VeryChat users */}
            {authMethod === "verychat" && currentAccount?.address && (
              <div className="flex items-center gap-2 text-xs text-dark-500">
                <span className="font-mono">
                  {`${currentAccount.address.slice(
                    0,
                    8
                  )}...${currentAccount.address.slice(-6)}`}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 rounded hover:bg-dark-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-brand-green" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Network Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 text-sm">
          <div className="w-2 h-2 rounded-full bg-brand-green" />
          <span className="text-dark-300">
            {authMethod === "verychat"
              ? "VeryChat"
              : currentAccount?.network || "Ethereum"}
          </span>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Your Achievements</h2>
          <div className="flex items-center gap-1 text-coral">
            <Award className="w-4 h-4" />
            <span className="font-bold">{completions.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(["book", "movie", "anime", "manga", "tvshow"] as const).map(
            (type) => {
              const Icon = statIcons[type];
              const count = typeStats[type] || 0;

              return (
                <div key={type} className="text-center">
                  <div
                    className={`
                  w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1
                  ${count > 0 ? "bg-coral/20" : "bg-dark-700"}
                `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        count > 0 ? "text-coral" : "text-dark-500"
                      }`}
                    />
                  </div>
                  <p className="text-sm font-bold text-white">{count}</p>
                  <p className="text-xs text-dark-500 capitalize">{type}s</p>
                </div>
              );
            }
          )}
        </div>
      </motion.div>

      {/* Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-white">Account</h2>

        {/* Email - Only for Wepin users */}
        {authMethod === "wepin" && wepinUser?.userInfo?.email && (
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
              <User className="w-5 h-5 text-dark-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-dark-400">Email</p>
              <p className="text-white">{wepinUser.userInfo.email}</p>
            </div>
          </div>
        )}

        {/* VeryChat Profile ID */}
        {authMethod === "verychat" && verychatUser && (
          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
              <User className="w-5 h-5 text-dark-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-dark-400">VeryChat Handle</p>
              <p className="text-white">@{verychatUser.profileId}</p>
            </div>
          </div>
        )}

        {/* Provider */}
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-dark-400">Connected via</p>
            <p className="text-white capitalize">
              {authMethod === "verychat"
                ? "VeryChat"
                : wepinUser?.userInfo?.provider || "Wepin"}
            </p>
          </div>
        </div>

        {/* Member Since */}
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-dark-400">Member since</p>
            <p className="text-white">{formatJoinDate(joinedAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="font-semibold text-white">Settings</h2>

        <button
          onClick={() => navigate("/settings")}
          className="card w-full flex items-center gap-4 hover:border-dark-700 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center">
            <Settings className="w-5 h-5 text-dark-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white">Preferences</p>
            <p className="text-sm text-dark-400">
              Tracking, notifications, custom sites
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-dark-500" />
        </button>

        <button
          onClick={handleLogout}
          className="card w-full flex items-center gap-4 border-brand-red/20 hover:border-brand-red/40 hover:bg-brand-red/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-red-400">Disconnect Wallet</p>
            <p className="text-sm text-dark-400">Log out of your account</p>
          </div>
        </button>
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-dark-600 pt-4">
        VeTerex v1.0.0 • Built for Hackathon
      </p>
    </div>
  );
}
