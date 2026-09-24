import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AdminLayout from "@/layouts/AdminLayout";
import MemberLayout from "@/layouts/MemberLayout";
import PublicLayout from "@/layouts/PublicLayout";
import RequireRole from "@/features/auth/RequireRole";
import LoginPage from "@/pages/public/LoginPage";
import PlaceholderPage from "@/pages/public/PlaceholderPage";
import FoundationPage from "@/pages/admin/FoundationPage";
import MemberHomePage from "@/pages/member/MemberHomePage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route
            path="/invitation/:token"
            element={<PlaceholderPage kind="invitation" />}
          />
          <Route
            path="/forbidden"
            element={<PlaceholderPage kind="forbidden" />}
          />
          <Route path="*" element={<PlaceholderPage kind="notFound" />} />
        </Route>
        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<FoundationPage />} />
            <Route
              path="events"
              element={<FoundationPage section="events" />}
            />
            <Route
              path="network"
              element={<FoundationPage section="network" />}
            />
          </Route>
        </Route>
        <Route element={<RequireRole role="member" />}>
          <Route path="/member" element={<MemberLayout />}>
            <Route index element={<MemberHomePage />} />
            <Route
              path="profile"
              element={<MemberHomePage section="myProfile" />}
            />
            <Route
              path="invitations"
              element={<MemberHomePage section="myInvitations" />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
