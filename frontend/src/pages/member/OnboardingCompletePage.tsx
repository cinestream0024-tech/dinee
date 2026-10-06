import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import { DineeArrowRightIcon, DineeCheckIcon } from "@/icons";

export default function OnboardingCompletePage() {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={`${t("dinee.onboardingCompleteTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.onboardingCompleteDescription")}
      />
      <div className="min-h-dvh bg-gray-25 text-gray-950 dark:bg-gray-950 dark:text-white">
        <OnboardingBrandHeader />
        <main className="onboarding-reveal mx-auto flex w-full max-w-xl flex-col items-center px-5 pb-10 pt-20 text-center sm:px-8 sm:pt-28">
          <span className="flex size-20 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
            <DineeCheckIcon aria-hidden="true" className="size-10" />
          </span>
          <h1 className="mt-7 text-title-sm font-semibold tracking-tight sm:text-title-md">
            {t("dinee.onboardingCompleteTitle")}
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-gray-600 dark:text-gray-300">
            {t("dinee.onboardingCompleteDescription")}
          </p>
          <Link
            to="/member"
            className="mt-9 flex min-h-13 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-base font-semibold text-white shadow-theme-lg transition-all hover:-translate-y-0.5 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transform-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
          >
            {t("dinee.onboardingOpenSpace")}
            <DineeArrowRightIcon aria-hidden="true" className="size-5 rtl:rotate-180" />
          </Link>
        </main>
      </div>
    </>
  );
}
