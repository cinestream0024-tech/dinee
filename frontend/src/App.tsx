import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AdminLayout from "@/layouts/AdminLayout";
import MemberLayout from "@/layouts/MemberLayout";
import PublicLayout from "@/layouts/PublicLayout";
import RequireRole from "@/features/auth/RequireRole";
import LoginPage from "@/pages/public/LoginPage";
import PlaceholderPage from "@/pages/public/PlaceholderPage";
import FoundationPage from "@/pages/admin/FoundationPage";
import MemberHomePage from "@/pages/member/MemberHomePage";
import { useTranslation } from "react-i18next";

const EventsPage = lazy(() => import("@/pages/admin/EventsPage"));
const NetworkPage = lazy(() => import("@/pages/admin/NetworkPage"));
const InvitationsPage = lazy(() => import("@/pages/admin/InvitationsPage"));
const InvitationPage = lazy(() => import("@/pages/public/InvitationPage"));
const MemberProfilePage = lazy(
  () => import("@/pages/member/MemberProfilePage"),
);
const MemberProfileEditPage = lazy(
  () => import("@/pages/member/MemberProfileEditPage"),
);
const MemberHistoryPage = lazy(
  () => import("@/pages/member/MemberHistoryPage"),
);
const MemberInvitationsPage = lazy(
  () => import("@/pages/member/MemberInvitationsPage"),
);
const OnboardingWelcomePage = lazy(
  () => import("@/pages/member/OnboardingWelcomePage"),
);
const OnboardingProfilePage = lazy(
  () => import("@/pages/member/OnboardingProfilePage"),
);

function RouteFallback() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
      {t("dinee.loading")}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />

        <Route element={<PublicLayout />}>
          <Route
            path="/invitation/:token"
            element={
              <Suspense fallback={<RouteFallback />}>
                <InvitationPage />
              </Suspense>
            }
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
              element={
                <Suspense fallback={<RouteFallback />}>
                  <EventsPage />
                </Suspense>
              }
            />
            <Route
              path="invitations"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <InvitationsPage />
                </Suspense>
              }
            />
            <Route
              path="network"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <NetworkPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole role="member" />}>
          <Route
            path="/onboarding"
            element={
              <Suspense fallback={<RouteFallback />}>
                <OnboardingWelcomePage />
              </Suspense>
            }
          />
          <Route
            path="/onboarding/profile"
            element={
              <Suspense fallback={<RouteFallback />}>
                <OnboardingProfilePage />
              </Suspense>
            }
          />
          <Route path="/member" element={<MemberLayout />}>
            <Route index element={<MemberHomePage />} />
            <Route
              path="profile"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MemberProfilePage />
                </Suspense>
              }
            />
            <Route
              path="profile/edit"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MemberProfileEditPage />
                </Suspense>
              }
            />
            <Route
              path="invitations"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MemberInvitationsPage />
                </Suspense>
              }
            />
            <Route
              path="history"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MemberHistoryPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
