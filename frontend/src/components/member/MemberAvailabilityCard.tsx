import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import {
  memberProfileKey,
  updateMemberAvailability,
} from "@/features/profiles/api";
import { DineeCheckIcon } from "@/icons";
import type { Availability, Profile } from "@/types/dinee";

const choices: Availability[] = [
  "available",
  "temporarily_unavailable",
  "unspecified",
];

export default function MemberAvailabilityCard({
  profile,
}: {
  profile: Profile;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateMemberAvailability,
    onSuccess: (updatedProfile) => {
      client.setQueryData(memberProfileKey, updatedProfile);
    },
  });

  const selected = mutation.data?.availability ?? profile.availability;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("dinee.myAvailability")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {t("dinee.availabilityDescription")}
        </p>
      </div>

      <fieldset className="mt-5" disabled={mutation.isPending}>
        <legend className="sr-only">{t("dinee.myAvailability")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {choices.map((choice) => {
            const active = selected === choice;
            return (
              <label
                key={choice}
                className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 ${
                  active
                    ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                } ${mutation.isPending ? "cursor-wait opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name="availability"
                  value={choice}
                  checked={active}
                  onChange={() => mutation.mutate(choice)}
                  className="sr-only"
                />
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {active && (
                    <DineeCheckIcon aria-hidden="true" className="size-3.5" />
                  )}
                </span>
                <span className="text-sm font-medium">
                  {t(`dinee.availability_${choice}`)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-3 min-h-5">
        {mutation.isSuccess && (
          <p className="text-sm font-medium text-success-600 dark:text-success-400">
            {t("dinee.availabilitySaved")}
          </p>
        )}
        {mutation.isError && (
          <MutationError message={t(apiErrorMessageKey(mutation.error))} />
        )}
      </div>
    </section>
  );
}
