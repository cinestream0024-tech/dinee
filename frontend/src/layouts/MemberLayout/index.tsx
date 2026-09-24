import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import SessionControls from "@/components/common/SessionControls";
export default function MemberLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-25 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 py-6">
        <span className="text-title-sm font-semibold">{t("dinee.brand")}</span>
        <SessionControls />
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
      <nav
        aria-label={t("dinee.memberNavigation")}
        className="mx-auto flex max-w-3xl flex-wrap gap-2 border-t border-gray-200 px-5 py-5 dark:border-gray-800"
      >
        {[
          ["/member", "memberHome"],
          ["/member/profile", "myProfile"],
          ["/member/invitations", "myInvitations"],
        ].map(([to, key]) => (
          <NavLink
            key={to}
            end
            to={to}
            className={({ isActive }) =>
              `min-h-12 rounded-xl px-4 py-3 text-sm ${isActive ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "text-gray-600 dark:text-gray-300"}`
            }
          >
            {t(`dinee.${key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
