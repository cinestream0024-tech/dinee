import { useTranslation } from "react-i18next";

interface OnboardingProgressProps {
  current: number;
  total: number;
  label: string;
  variant?: "bar" | "dots";
}

export default function OnboardingProgress({
  current,
  total,
  label,
  variant = "bar",
}: OnboardingProgressProps) {
  const { t } = useTranslation();
  const percentage = Math.round((current / total) * 100);

  if (variant === "dots") {
    return (
      <div
        role="progressbar"
        aria-label={`${label} · ${t("dinee.onboardingStepCount", { current, total })}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        className="flex items-center justify-center gap-2"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`h-2 rounded-full transition-all duration-500 motion-reduce:transition-none ${
              index + 1 === current
                ? "w-6 bg-brand-500"
                : "w-2 bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full" aria-label={t("dinee.onboardingProgressLabel")}>
      <div className="mb-2 flex items-center justify-between gap-4 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        <span>{label}</span>
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
