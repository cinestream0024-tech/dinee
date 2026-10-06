import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import OnboardingBrandHeader from "@/components/onboarding/OnboardingBrandHeader";
import OnboardingProfileForm from "@/components/onboarding/OnboardingProfileForm";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { getMemberProfile, memberProfileKey } from "@/features/profiles/api";
import { DineeAlertIcon } from "@/icons";

export default function OnboardingProfilePage() {
  const { t } = useTranslation();
  const profileQuery = useQuery({
    queryKey: memberProfileKey,
    queryFn: getMemberProfile,
  });

  return (
    <>
      <PageMeta
        title={`${t("dinee.onboardingProfileTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.onboardingProfileDescription")}
      />

      <div className="min-h-dvh bg-gray-25 text-gray-950 dark:bg-gray-950 dark:text-white">
        <OnboardingBrandHeader />

        <main className="onboarding-reveal mx-auto w-full max-w-2xl px-5 pb-8 pt-5 sm:px-8 sm:pb-12 sm:pt-10">
          <OnboardingProgress
            current={2}
            total={4}
            label={t("dinee.onboardingProfileStep")}
          />

          <section className="mb-8 mt-9 sm:mt-12">
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {t("dinee.onboardingProfileEyebrow")}
            </p>
            <h1 className="mt-2 text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
              {t("dinee.onboardingProfileTitle")}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
              {t("dinee.onboardingProfileDescription")}
            </p>
          </section>

          {profileQuery.isPending && (
            <div role="status" aria-label={t("dinee.loading")} className="animate-pulse space-y-5">
              <div className="h-40 rounded-3xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-96 rounded-3xl bg-gray-100 dark:bg-gray-800" />
            </div>
          )}

          {profileQuery.isError && (
            <div role="alert" className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
                <DineeAlertIcon aria-hidden="true" className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
                {t("dinee.loadFailed")}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("dinee.networkError")}
              </p>
              <button
                type="button"
                onClick={() => profileQuery.refetch()}
                className="mt-5 min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {t("dinee.retry")}
              </button>
            </div>
          )}

          {profileQuery.data && <OnboardingProfileForm profile={profileQuery.data} />}
        </main>
      </div>
    </>
  );
}
