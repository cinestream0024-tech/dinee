import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useSession } from "@/features/auth/auth";
import PageMeta from "@/components/common/PageMeta";
import { DineeArrowRightIcon, DineeHistoryIcon } from "@/icons";
export default function MemberHomePage({
  section = "memberHome",
}: {
  section?: "memberHome" | "myProfile" | "myInvitations";
}) {
  const { t } = useTranslation();
  const { data: user } = useSession();
  return (
    <>
      <PageMeta
        title={`${t(`dinee.${section}`)} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />
      <p className="text-sm tracking-widest text-gray-500 uppercase dark:text-gray-400">
        {t("dinee.memberSpace")}
      </p>
      <h1 className="mt-4 text-title-md font-semibold">
        {section === "memberHome"
          ? t("dinee.welcome", { name: user?.name })
          : t(`dinee.${section}`)}
      </h1>
      <p className="mt-6 leading-relaxed text-gray-600 dark:text-gray-300">
        {t("dinee.memberDescription")}
      </p>
      {section === "memberHome" && (
        <Link
          to="/member/history"
          className="mt-8 flex min-h-20 items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs transition-colors hover:border-brand-200 hover:bg-brand-25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <DineeHistoryIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-gray-900 dark:text-white">
              {t("dinee.myHistory")}
            </span>
            <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
              {t("dinee.historyHomeDescription")}
            </span>
          </span>
          <DineeArrowRightIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-gray-400 rtl:rotate-180"
          />
        </Link>
      )}
    </>
  );
}
