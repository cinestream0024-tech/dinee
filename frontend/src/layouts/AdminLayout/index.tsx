import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { GridIcon, CalenderIcon, GroupIcon, CloseIcon } from "@/icons";
import SessionControls from "@/components/common/SessionControls";
function AdminShell() {
  const { t } = useTranslation();
  const { isMobileOpen, toggleMobileSidebar, setIsMobileOpen } = useSidebar();
  const items = [
    { to: "/admin", key: "adminHome", Icon: GridIcon },
    { to: "/admin/events", key: "events", Icon: CalenderIcon },
    { to: "/admin/network", key: "network", Icon: GroupIcon },
  ];
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {isMobileOpen && (
        <button
          aria-label={t("dinee.closeMenu")}
          className="fixed inset-0 z-40 bg-gray-950/50 xl:hidden dark:bg-gray-950/70"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        aria-label={t("dinee.adminNavigation")}
        className={`fixed inset-y-0 start-0 z-50 w-72 border-e border-gray-200 bg-white p-6 transition-transform xl:translate-x-0 dark:border-gray-800 dark:bg-gray-900 ${isMobileOpen ? "translate-x-0" : "invisible -translate-x-full rtl:translate-x-full xl:visible rtl:xl:translate-x-0"}`}
      >
        <div className="mb-10 flex items-center justify-between">
          <span className="text-title-sm font-semibold">
            {t("dinee.brand")}
          </span>
          <button
            className="min-h-11 min-w-11 xl:hidden"
            aria-label={t("dinee.closeMenu")}
            onClick={toggleMobileSidebar}
          >
            <CloseIcon className="size-6" />
          </button>
        </div>
        <p className="mb-4 text-theme-xs text-gray-500 uppercase dark:text-gray-400">
          {t("dinee.adminSpace")}
        </p>
        <nav className="space-y-2">
          {items.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              end
              to={to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `menu-item ${isActive ? "menu-item-active" : "menu-item-inactive"}`
              }
            >
              <Icon className="size-6" />
              {t(`dinee.${key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="xl:ms-72">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white p-4 md:px-6 dark:border-gray-800 dark:bg-gray-900">
          <button
            aria-expanded={isMobileOpen}
            onClick={toggleMobileSidebar}
            className="min-h-11 rounded-lg border border-gray-200 px-4 xl:hidden dark:border-gray-700"
          >
            {t("dinee.menu")}
          </button>
          <span className="font-medium">{t("dinee.adminSpace")}</span>
          <SessionControls />
        </header>
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminShell />
    </SidebarProvider>
  );
}
