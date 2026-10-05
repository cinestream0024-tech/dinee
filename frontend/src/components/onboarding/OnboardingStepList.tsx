import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  DineeAddUserIcon,
  DineeCompanyIcon,
  DineeCheckIcon,
} from "@/icons";

function Step({
  icon,
  title,
  description,
  last = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <li className={`flex gap-4 py-4 ${last ? "" : "border-b border-gray-100 dark:border-gray-800"}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-200">
        {icon}
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block font-semibold text-gray-900 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-gray-500 dark:text-gray-400">
          {description}
        </span>
      </span>
    </li>
  );
}

export default function OnboardingStepList() {
  const { t } = useTranslation();

  return (
    <ol aria-label={t("dinee.onboardingProcessTitle")}>
      <Step
        icon={<DineeAddUserIcon aria-hidden="true" className="size-5" />}
        title={t("dinee.onboardingProfileTitle")}
        description={t("dinee.onboardingProfileDescription")}
      />
      <Step
        icon={<DineeCompanyIcon aria-hidden="true" className="size-5" />}
        title={t("dinee.onboardingIntentionsTitle")}
        description={t("dinee.onboardingIntentionsDescription")}
      />
      <Step
        last
        icon={<DineeCheckIcon aria-hidden="true" className="size-5" />}
        title={t("dinee.onboardingPreferencesTitle")}
        description={t("dinee.onboardingPreferencesDescription")}
      />
    </ol>
  );
}
