import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { CollectionPage } from "./pages/CollectionPage";
import { CommunityPage } from "./pages/CommunityPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { MediaDetailPage } from "./pages/MediaDetailPage";
import { MintPage } from "./pages/MintPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Default route - redirect to home */}
          <Route index element={<HomePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/group/:id" element={<GroupDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/media/:id" element={<MediaDetailPage />} />
          <Route path="/mint" element={<MintPage />} />
          {/* Catch all unmatched routes - 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
