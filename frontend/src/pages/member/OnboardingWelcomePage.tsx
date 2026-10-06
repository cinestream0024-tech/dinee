import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingWelcomeVisual from "@/components/onboarding/OnboardingWelcomeVisual";
import { useSession } from "@/features/auth/auth";
import { DineeArrowRightIcon } from "@/icons";

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

        <main className="onboarding-reveal mx-auto flex w-full max-w-xl flex-col px-5 pb-8 pt-2 sm:px-8 sm:pb-12 sm:pt-6">
          <OnboardingWelcomeVisual />

          <section className="mt-8 text-center">
            <h1 className="text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
              {t("dinee.onboardingWelcomeName", { name: firstName })}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("dinee.onboardingWelcomeDescription")}
            </p>
          </section>

          <div className="mt-6">
            <OnboardingProgress
              current={1}
              total={4}
              label={t("dinee.onboardingWelcomeStep")}
              variant="dots"
            />
          </div>

          <div className="mt-7 sm:mt-8">
            <Link
              to="/onboarding/profile"
              className="mx-auto flex min-h-13 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-base font-semibold text-white shadow-theme-lg transition-all hover:-translate-y-0.5 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transform-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
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
