import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import OnboardingIntentionsForm from "@/components/onboarding/OnboardingIntentionsForm";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { getMemberProfile, memberProfileKey } from "@/features/profiles/api";
import { DineeAlertIcon } from "@/icons";

export default function OnboardingIntentionsPage() {
  const { t } = useTranslation();
  const profileQuery = useQuery({
    queryKey: memberProfileKey,
    queryFn: getMemberProfile,
  });

  return (
    <>
      <PageMeta
        title={`${t("dinee.onboardingIntentionsTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.onboardingIntentionsDescription")}
      />

      <div className="min-h-dvh bg-gray-25 text-gray-950 dark:bg-gray-950 dark:text-white">
        <OnboardingBrandHeader />
        <main className="onboarding-reveal mx-auto w-full max-w-2xl px-5 pb-8 pt-5 sm:px-8 sm:pb-12 sm:pt-10">
          <OnboardingProgress
            current={3}
            total={4}
            label={t("dinee.onboardingIntentionsTitle")}
          />

          <section className="mb-7 mt-7 sm:mt-10">
            <h1 className="text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
              {t("dinee.onboardingIntentionsTitle")}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("dinee.onboardingIntentionsDescription")}
            </p>
          </section>

          {profileQuery.isPending && (
            <div role="status" aria-label={t("dinee.loading")} className="animate-pulse space-y-5">
              <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            </div>
          )}

          {profileQuery.isError && (
            <div role="alert" className="py-12 text-center">
              <DineeAlertIcon aria-hidden="true" className="mx-auto size-8 text-error-500" />
              <h2 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
                {t("dinee.loadFailed")}
              </h2>
              <button
                type="button"
                onClick={() => profileQuery.refetch()}
                className="mt-5 min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {t("dinee.retry")}
              </button>
            </div>
          )}

          {profileQuery.data && <OnboardingIntentionsForm profile={profileQuery.data} />}
        </main>
      </div>
    </>
  );
}
