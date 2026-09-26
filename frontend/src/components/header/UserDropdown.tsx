import { useLogout, useSession } from "@/features/auth/auth";
import { ChevronDownIcon, GlobeIcon, LogoutIcon } from "@/icons";
import { useLanguage } from "@/context/LanguageContext";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const user = session.data;
  const initials =
    user?.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "D";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
        aria-expanded={isOpen}
        aria-label={t("dinee.accountMenu")}
      >
        <span className="me-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
          {initials}
        </span>
        <span className="me-1 hidden max-w-36 truncate text-theme-sm font-medium sm:block">
          {user?.name ?? t("dinee.adminSpace")}
        </span>
        <ChevronDownIcon
          className={`size-5 stroke-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute inset-e-0 mt-4.25 flex w-72 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-2 py-1">
          <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.name}
          </span>
          <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </span>
        </div>

        <div className="my-3 border-t border-gray-200 pt-3 dark:border-gray-800">
          <label
            htmlFor="account-language"
            className="mb-2 flex items-center gap-2 px-2 text-theme-xs font-medium text-gray-500 dark:text-gray-400"
          >
            <GlobeIcon className="size-4" />
            {t("dinee.language")}
          </label>
          <select
            id="account-language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as typeof language)
            }
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm text-gray-700 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {availableLanguages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate("/login", { replace: true }),
            })
          }
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        >
          <LogoutIcon className="size-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400" />
          {t(logout.isPending ? "dinee.loading" : "dinee.logout")}
        </button>

        {logout.isError && (
          <p
            role="alert"
            className="px-3 pt-2 text-theme-xs text-error-600 dark:text-error-400"
          >
            {t("dinee.networkError")}
          </p>
        )}
      </Dropdown>
    </div>
  );
}
