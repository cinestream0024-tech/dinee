import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { HorizontaLDots, MenuIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function AppHeader() {
  const { t } = useTranslation();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1280) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white xl:border-b dark:border-gray-800 dark:bg-gray-900">
      <div className="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
        <div className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-3 py-3 xl:justify-start xl:border-b-0 xl:px-0 xl:py-4 dark:border-gray-800">
          <button
            type="button"
            className={cn(
              "z-99999 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:h-11 lg:w-11 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
              isMobileOpen && "bg-gray-100 dark:bg-white/3",
            )}
            onClick={handleSidebarToggle}
            aria-label={t("dinee.menu")}
            aria-expanded={isMobileOpen}
          >
            <MenuIcon className="size-6" />
          </button>

          <Link
            to="/admin"
            className="flex items-center gap-2 xl:hidden"
            aria-label={t("dinee.brand")}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
              D
            </span>
            <span className="font-semibold tracking-[0.14em] text-gray-900 uppercase dark:text-white">
              {t("dinee.brand")}
            </span>
          </Link>

          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.adminCockpit")}
            </p>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {t("dinee.adminCockpitDescription")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setApplicationMenuOpen((open) => !open)}
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 xl:hidden dark:text-gray-400 dark:hover:bg-white/5"
            aria-label={t("dinee.accountActions")}
            aria-expanded={isApplicationMenuOpen}
          >
            <HorizontaLDots className="size-6" />
          </button>
        </div>

        <div
          className={cn(
            "w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md xl:flex xl:w-auto xl:justify-end xl:px-0 xl:py-0 xl:shadow-none",
            isApplicationMenuOpen ? "flex" : "hidden",
          )}
        >
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
