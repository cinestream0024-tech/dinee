import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import MemberAccountMenu from "@/components/member/MemberAccountMenu";
import MemberNavigation from "@/components/member/MemberNavigation";

export default function MemberLayout() {
  const { t } = useTranslation();
  const editingProfile = useLocation().pathname.startsWith(
    "/member/profile/edit",
  );

  return (
    <div className="min-h-dvh bg-gray-25 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-99 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <span className="shrink-0 text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
              {t("dinee.brand")}
            </span>
            {!editingProfile && <MemberNavigation variant="desktop" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggleButton />
            <MemberAccountMenu />
          </div>
        </div>
      </header>

      <main
        className={`mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8 ${
          editingProfile ? "pb-8" : "pb-28 md:pb-10"
        }`}
      >
        <Outlet />
      </main>

      {!editingProfile && <MemberNavigation variant="mobile" />}
    </div>
  );
}
