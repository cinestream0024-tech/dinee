import { useSidebar } from "@/context/SidebarContext";
import {
  DineeCalendarIcon,
  DineeDashboardIcon,
  DineeUsersIcon,
  DineeMoreIcon,
} from "@/icons";
import { cn } from "@/utils";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";

const items = [
  { to: "/admin", key: "adminHome", Icon: DineeDashboardIcon, end: true },
  { to: "/admin/events", key: "events", Icon: DineeCalendarIcon, end: false },
  { to: "/admin/network", key: "network", Icon: DineeUsersIcon, end: false },
] as const;

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const showsLabels = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    if (isMobileOpen) setIsMobileOpen(false);
    // The route change is the only event that should close the mobile drawer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside
      aria-label={t("dinee.adminNavigation")}
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-gray-800 dark:bg-gray-900",
        isExpanded || isMobileOpen || isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex min-h-24 items-center py-7",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
        )}
      >
        <NavLink
          to="/admin"
          className="inline-flex items-center gap-3"
          aria-label={t("dinee.brand")}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold tracking-wider text-white shadow-theme-xs">
            D
          </span>
          {showsLabels && (
            <span className="text-lg font-semibold tracking-[0.16em] text-gray-900 uppercase dark:text-white">
              {t("dinee.brand")}
            </span>
          )}
        </NavLink>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <h2
            className={cn(
              "mb-4 flex text-xs leading-5 text-gray-400 uppercase",
              !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
            )}
          >
            {showsLabels ? (
              t("dinee.adminMenu")
            ) : (
              <DineeMoreIcon className="size-6" />
            )}
          </h2>

          <ul className="flex flex-col gap-1">
            {items.map(({ to, key, Icon, end }) => (
              <li key={to}>
                <NavLink
                  end={end}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "group menu-item",
                      isActive ? "menu-item-active" : "menu-item-inactive",
                      !showsLabels && "xl:justify-center",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "menu-item-icon-size",
                          isActive
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive",
                        )}
                      >
                        <Icon className="size-6" />
                      </span>
                      {showsLabels && (
                        <span className="menu-item-text">
                          {t(`dinee.${key}`)}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {showsLabels && (
          <div className="mt-auto mb-6 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/3">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.privateNetwork")}
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              {t("dinee.privateNetworkDescription")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
