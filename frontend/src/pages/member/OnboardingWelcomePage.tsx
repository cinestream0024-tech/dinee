import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingStepList from "@/components/onboarding/OnboardingStepList";
import { useSession } from "@/features/auth/auth";
import { DineeArrowRightIcon, DineeCheckIcon } from "@/icons";

export default function OnboardingWelcomePage() {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <PageMeta
        title={`${t("dinee.onboardingWelcomeTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.onboardingWelcomeDescription")}
      />

      <div className="min-h-dvh bg-gray-25 text-gray-950 dark:bg-gray-950 dark:text-white">
        <OnboardingBrandHeader />

        <main className="onboarding-reveal mx-auto flex w-full max-w-xl flex-col px-5 pb-8 pt-5 sm:px-8 sm:pb-12 sm:pt-10">
          <OnboardingProgress
            current={1}
            total={4}
            label={t("dinee.onboardingWelcomeStep")}
          />

          <section className="mt-10 sm:mt-14">
            <span className="flex size-16 items-center justify-center rounded-full bg-success-50 text-success-600 ring-1 ring-success-100 ring-inset dark:bg-success-500/15 dark:text-success-400 dark:ring-success-500/20">
              <DineeCheckIcon aria-hidden="true" className="size-8" />
            </span>

            <p className="mt-7 text-sm font-semibold text-brand-600 dark:text-brand-400">
              {t("dinee.onboardingInvitationConfirmed")}
            </p>
            <h1 className="mt-2 text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
              {t("dinee.onboardingWelcomeName", { name: firstName })}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("dinee.onboardingWelcomeDescription")}
            </p>
          </section>

          <section className="mt-9 rounded-3xl border border-gray-200 bg-white px-5 py-2 shadow-theme-xs sm:px-6 dark:border-gray-800 dark:bg-white/3">
            <h2 className="sr-only">{t("dinee.onboardingProcessTitle")}</h2>
            <OnboardingStepList />
          </section>

          <div className="mt-8 sm:mt-10">
            <Link
              to="/onboarding/profile"
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-base font-semibold text-white shadow-theme-sm transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
            >
              {t("dinee.onboardingStart")}
              <DineeArrowRightIcon
                aria-hidden="true"
                className="size-5 rtl:rotate-180"
              />
            </Link>
            <p className="mt-3 text-center text-theme-xs leading-5 text-gray-500 dark:text-gray-400">
              {t("dinee.onboardingTimeEstimate")}
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
