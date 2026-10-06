import { useState, type ComponentType, type SVGProps } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import {
  memberProfileKey,
  updateMemberAvailability,
} from "@/features/profiles/api";
import {
  DineeCheckIcon,
  DineeChevronLeftIcon,
  DineeClockIcon,
  DineeResetIcon,
} from "@/icons";
import type { Availability, Profile } from "@/types/dinee";

interface Choice {
  value: Availability;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const choices: Choice[] = [
  { value: "available", icon: DineeCheckIcon },
  { value: "temporarily_unavailable", icon: DineeClockIcon },
  { value: "unspecified", icon: DineeResetIcon },
];

export default function OnboardingPreferencesForm({
  profile,
}: {
  profile: Profile;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [selected, setSelected] = useState<Availability>(profile.availability);
  const mutation = useMutation({
    mutationFn: updateMemberAvailability,
    onSuccess: (updatedProfile) => {
      client.setQueryData(memberProfileKey, updatedProfile);
      navigate("/onboarding/complete", { replace: true });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(selected);
      }}
      className="space-y-7"
    >
      {mutation.isError && (
        <MutationError message={t(apiErrorMessageKey(mutation.error))} />
      )}

      <fieldset className="space-y-3">
        <legend className="sr-only">
          {t("dinee.onboardingAvailabilityQuestion")}
        </legend>
        {choices.map(({ value, icon: Icon }) => {
          const checked = selected === value;

          return (
            <label
              key={value}
              className={`flex min-h-20 cursor-pointer items-center gap-4 rounded-3xl px-5 py-4 transition focus-within:ring-3 focus-within:ring-brand-500/20 ${
                checked
                  ? "bg-brand-50 text-brand-700 shadow-focus-ring dark:bg-brand-500/15 dark:text-brand-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/8"
              }`}
            >
              <input
                type="radio"
                name="onboarding-availability"
                value={value}
                checked={checked}
                onChange={() => setSelected(value)}
                className="sr-only"
              />
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                checked
                  ? "bg-white text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
                  : "bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              }`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1 font-semibold">
                {t(`dinee.availability_${value}`)}
              </span>
              <span
                aria-hidden="true"
                className={`size-3 rounded-full ${
                  checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
              />
            </label>
          );
        })}
      </fieldset>

      <footer className="sticky bottom-0 z-9 -mx-5 bg-gray-25/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Link
            to="/onboarding/intentions"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-gray-600 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white"
          >
            <DineeChevronLeftIcon
              aria-hidden="true"
              className="size-4 rtl:rotate-180"
            />
            {t("dinee.onboardingBack")}
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-gray-950 px-6 text-sm font-semibold text-white shadow-theme-sm transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
          >
            {mutation.isPending
              ? t("dinee.saving")
              : t("dinee.onboardingFinish")}
          </button>
        </div>
      </footer>
    </form>
  );
}
