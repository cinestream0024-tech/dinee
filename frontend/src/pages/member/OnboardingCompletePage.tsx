import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import { DineeArrowRightIcon } from "@/icons";

export default function OnboardingCompletePage() {
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={`${t("dinee.onboardingCompleteTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.onboardingCompleteDescription")}
      />
      <div className="flex min-h-dvh flex-col overflow-hidden bg-gray-25 text-gray-950 dark:bg-gray-950 dark:text-white">
        <OnboardingBrandHeader />
        <main className="onboarding-reveal mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] text-center sm:px-8 sm:pb-12">
          <section
            aria-live="polite"
            className="flex flex-1 flex-col items-center justify-center pb-10"
          >
            <img
              src="/images/image-gen-2.png"
              alt=""
              width="112"
              height="112"
              className="size-28 object-contain drop-shadow-xl"
            />
            <h1 className="mt-8 text-title-md font-semibold tracking-tight text-gray-950 sm:text-title-lg dark:text-white">
              {t("dinee.onboardingCompleteTitle")}
            </h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("dinee.onboardingCompleteDescription")}
            </p>
          </section>

          <Link
            to="/member"
            className="mx-auto flex min-h-13 w-full max-w-sm shrink-0 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-base font-semibold text-white shadow-theme-lg transition-all hover:-translate-y-0.5 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transform-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
          >
            {t("dinee.onboardingOpenSpace")}
            <DineeArrowRightIcon
              aria-hidden="true"
              className="size-5 rtl:rotate-180"
            />
          </Link>
        </main>
      </div>
    </>
  );
}
