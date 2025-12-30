import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserCog } from "react-icons/fa";
import { Header } from "./Header";
import { ToastContainer } from "./Toast";
import { HomeNavIcon, CollectionsNavIcon, CommunityNavIcon } from "./AppIcons";

interface LayoutProps {
  children: ReactNode;
}

// Navigation items with custom icons
const navItems = [
  { path: "/", label: "Home", type: "home" as const },
  { path: "/collection", label: "Collection", type: "collections" as const },
  { path: "/community", label: "Community", type: "community" as const },
  { path: "/profile", label: "Profile", type: "profile" as const },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Render navigation icon based on type
  const renderNavIcon = (type: string, isActive: boolean) => {
    switch (type) {
      case "home":
        return <HomeNavIcon isActive={isActive} size={20} />;
      case "collections":
        // Adjusted sizes: active slightly smaller, inactive slightly larger for consistency
        return (
          <CollectionsNavIcon isActive={isActive} size={isActive ? 20 : 26} />
        );
      case "community":
        // Adjusted size: inactive slightly smaller
        return (
          <CommunityNavIcon isActive={isActive} size={isActive ? 18 : 14} />
        );
      case "profile":
        return (
          <FaUserCog
            className="w-4 h-4"
            style={{ color: isActive ? "#7C60FD" : "#505966" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen h-full bg-app-gradient flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative z-10 pb-20 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-dark-700/50">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map(({ path, label, type }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "text-violet bg-violet/10"
                    : "text-dark-400 hover:text-dark-200 hover:bg-dark-800/50"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {renderNavIcon(type, isActive)}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -inset-1 bg-violet/20 rounded-lg -z-10"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-violet" : ""
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
