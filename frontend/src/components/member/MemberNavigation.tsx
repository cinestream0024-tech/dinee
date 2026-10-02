import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import {
  DineeCalendarIcon,
  DineeDashboardIcon,
  UserCircleIcon,
} from "@/icons";

const items = [
  { to: "/member", key: "memberHome", icon: DineeDashboardIcon, end: true },
  {
    to: "/member/invitations",
    key: "myInvitations",
    icon: DineeCalendarIcon,
    end: false,
  },
  {
    to: "/member/profile",
    key: "myProfile",
    icon: UserCircleIcon,
    end: false,
  },
] as const;

type NavigationVariant = "desktop" | "mobile";

export default function MemberNavigation({
  variant,
}: {
  variant: NavigationVariant;
}) {
  const { t } = useTranslation();
  const mobile = variant === "mobile";

  return (
    <nav
      aria-label={t("dinee.memberNavigation")}
      className={
        mobile
          ? "fixed inset-x-0 bottom-0 z-99 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden dark:border-gray-800 dark:bg-gray-950/95"
          : "hidden items-center gap-1 md:flex"
      }
    >
      <div
        className={mobile ? "mx-auto grid max-w-3xl grid-cols-3" : "contents"}
      >
        {items.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              mobile
                ? `flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-theme-xs font-medium transition-colors ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                  }`
                : `flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`
            }
          >
            <Icon aria-hidden="true" className={mobile ? "size-5" : "size-4"} />
            <span>{t(`dinee.${key}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
