import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@/icons";
import { useLanguage } from "@/context/LanguageContext";
import { useLogout, useSession } from "@/features/auth/auth";

export default function MemberAccountMenu() {
  const { t } = useTranslation();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const initial =
    session.data?.name.trim().charAt(0).toLocaleUpperCase() || "D";

  return (
    <details className="group relative">
      <summary
        aria-label={t("dinee.accountMenu")}
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pe-2 text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {initial}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="absolute end-0 top-full z-99 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-2 pb-3 dark:border-gray-800">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {session.data?.name}
          </p>
          <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
            {session.data?.email}
          </p>
        </div>

        <label className="mt-3 block px-2 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
          {t("dinee.language")}
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as typeof language)
            }
            className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-brand-700"
          >
            {availableLanguages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate("/login", { replace: true }),
            })
          }
          className="mt-2 min-h-11 w-full rounded-xl px-2 text-start text-sm font-medium text-error-600 transition-colors hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-error-500/10"
        >
          {t("dinee.logout")}
        </button>
        {logout.isError && (
          <p
            role="alert"
            className="px-2 pt-2 text-theme-xs text-error-600 dark:text-error-400"
          >
            {t("dinee.networkError")}
          </p>
        )}
      </div>
    </details>
  );
}
