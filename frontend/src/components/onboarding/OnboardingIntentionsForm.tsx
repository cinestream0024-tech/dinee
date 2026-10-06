import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import FormField from "@/components/admin/FormField";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey, hasFieldError } from "@/components/admin/apiErrors";
import { memberProfileKey, updateMemberProfile } from "@/features/profiles/api";
import {
  DineeAddUserIcon,
  DineeArrowRightIcon,
  DineeChevronLeftIcon,
  DineeSearchIcon,
  SparkIcon,
} from "@/icons";
import type { Profile } from "@/types/dinee";
import { cn } from "@/utils";

type IntentionsField = "interests" | "looking_for" | "contributions";
type IntentionsState = Record<IntentionsField, string>;

const nullable = (value: string) => value.trim() || null;

export default function OnboardingIntentionsForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [form, setForm] = useState<IntentionsState>({
    interests: profile.interests ?? "",
    looking_for: profile.looking_for ?? "",
    contributions: profile.contributions ?? "",
  });
  const mutation = useMutation({
    mutationFn: updateMemberProfile,
    onSuccess: (updatedProfile) => {
      client.setQueryData(memberProfileKey, updatedProfile);
      navigate("/member/profile", {
        replace: true,
        state: { profileUpdated: true },
      });
    },
  });

  const field = (
    name: IntentionsField,
    label: string,
    placeholder: string,
    icon: ReactNode,
  ) => {
    const id = `onboarding-intentions-${name}`;
    const error = hasFieldError(mutation.error, name)
      ? t("dinee.invalidField")
      : undefined;

    return (
      <FormField id={id} label={label} error={error}>
        <div className="relative">
          <span className="pointer-events-none absolute start-4 top-4 text-gray-400 dark:text-gray-500">
            {icon}
          </span>
          <textarea
            id={id}
            rows={3}
            maxLength={1000}
            value={form[name]}
            onChange={(event) =>
              setForm((current) => ({ ...current, [name]: event.target.value }))
            }
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            className={cn(
              "min-h-28 w-full resize-y rounded-2xl border border-transparent bg-gray-100 py-3.5 pe-4 ps-11 text-base leading-6 text-gray-950 outline-hidden transition placeholder:text-gray-400 focus:bg-white focus:ring-3 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900",
              error
                ? "border-error-500 focus:ring-error-500/20"
                : "focus:border-brand-300 focus:ring-brand-500/15 dark:focus:border-brand-700",
            )}
          />
        </div>
      </FormField>
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({
      interests: nullable(form.interests),
      looking_for: nullable(form.looking_for),
      contributions: nullable(form.contributions),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {mutation.isError && (
        <MutationError message={t(apiErrorMessageKey(mutation.error))} />
      )}

      {field(
        "interests",
        t("dinee.onboardingInterestsLabel"),
        t("dinee.onboardingInterestsPlaceholder"),
        <SparkIcon aria-hidden="true" className="size-5" />,
      )}
      {field(
        "looking_for",
        t("dinee.onboardingLookingForLabel"),
        t("dinee.onboardingLookingForPlaceholder"),
        <DineeSearchIcon aria-hidden="true" className="size-5" />,
      )}
      {field(
        "contributions",
        t("dinee.onboardingContributionsLabel"),
        t("dinee.onboardingContributionsPlaceholder"),
        <DineeAddUserIcon aria-hidden="true" className="size-5" />,
      )}

      <footer className="sticky bottom-0 z-9 -mx-5 bg-gray-25/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Link
            to="/onboarding/profile"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-gray-600 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white"
          >
            <DineeChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("dinee.onboardingBack")}
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 text-sm font-semibold text-white shadow-theme-sm transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
          >
            {mutation.isPending ? t("dinee.saving") : t("dinee.onboardingSaveProfile")}
            {!mutation.isPending && (
              <DineeArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
            )}
          </button>
        </div>
      </footer>
    </form>
  );
}
