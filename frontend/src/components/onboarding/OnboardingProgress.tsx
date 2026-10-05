import { useTranslation } from "react-i18next";

interface OnboardingProgressProps {
  current: number;
  total: number;
}

export default function OnboardingProgress({
  current,
  total,
}: OnboardingProgressProps) {
  const { t } = useTranslation();
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full" aria-label={t("dinee.onboardingProgressLabel")}>
      <div className="mb-2 flex items-center justify-between gap-4 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        <span>{t("dinee.onboardingWelcomeStep")}</span>
        <span>{t("dinee.onboardingStepCount", { current, total })}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
      >
        <span
          className="block h-full rounded-full bg-brand-500 transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
