import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import FormField from "@/components/admin/FormField";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey, hasFieldError } from "@/components/admin/apiErrors";
import MemberProfilePhotoEditor from "@/components/member/MemberProfilePhotoEditor";
import { memberProfileKey, updateMemberProfile } from "@/features/profiles/api";
import {
  DineeArrowRightIcon,
  DineeChevronLeftIcon,
  DineeCompanyIcon,
  DineeEditIcon,
  GlobeIcon,
  UserIcon,
} from "@/icons";
import type { Profile } from "@/types/dinee";
import { cn } from "@/utils";

interface ProfileStepState {
  first_name: string;
  last_name: string;
  job_title: string;
  company: string;
  sector: string;
  bio: string;
  linkedin_url: string;
}

const nullable = (value: string) => value.trim() || null;
const controlClass = (hasError = false) =>
  cn(
    "h-13 w-full rounded-2xl border border-transparent bg-gray-100 px-4 text-base text-gray-950 outline-hidden transition placeholder:text-gray-400 focus:bg-white focus:ring-3 dark:bg-white/5 dark:text-white dark:focus:bg-gray-900",
    hasError
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
      : "focus:border-brand-300 focus:ring-brand-500/15 dark:focus:border-brand-700",
  );
const textAreaClass = (hasError = false) =>
  cn(controlClass(hasError), "h-auto min-h-32 resize-y py-3.5 leading-6");
const isLinkedInProfile = (value: string) => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return (
      ["linkedin.com", "www.linkedin.com"].includes(url.hostname.toLowerCase()) &&
      /^\/in\/[A-Za-z0-9_%.-]+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
};

export default function OnboardingProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [form, setForm] = useState<ProfileStepState>({
    first_name: profile.first_name,
    last_name: profile.last_name,
    job_title: profile.job_title ?? "",
    company: profile.company ?? "",
    sector: profile.sector ?? "",
    bio: profile.bio ?? "",
    linkedin_url: profile.linkedin_url ?? "",
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
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

  const set = (field: keyof ProfileStepState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const fieldError = (field: keyof ProfileStepState) =>
    clientErrors[field] ||
    (hasFieldError(mutation.error, field)
      ? t(field === "linkedin_url" ? "dinee.linkedinProfileError" : "dinee.invalidField")
      : undefined);

  const input = (
    field: keyof ProfileStepState,
    type = "text",
    autoComplete?: string,
    icon?: ReactNode,
    placeholder?: string,
  ) => {
    const id = `onboarding-profile-${field}`;
    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={form[field]}
          onChange={(event) => set(field, event.target.value)}
          className={cn(
            controlClass(Boolean(fieldError(field))),
            icon && "ps-11",
          )}
          aria-invalid={Boolean(fieldError(field))}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={field === "first_name" || field === "last_name"}
        />
      </div>
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = t("dinee.requiredField");
    if (!form.last_name.trim()) errors.last_name = t("dinee.requiredField");
    if (!isLinkedInProfile(form.linkedin_url)) {
      errors.linkedin_url = t("dinee.linkedinProfileError");
    }
    if (Object.keys(errors).length) {
      setClientErrors(errors);
      document
        .getElementById(`onboarding-profile-${Object.keys(errors)[0]}`)
        ?.focus();
      return;
    }

    mutation.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      job_title: nullable(form.job_title),
      company: nullable(form.company),
      sector: nullable(form.sector),
      bio: nullable(form.bio),
      linkedin_url: nullable(form.linkedin_url),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {mutation.isError && (
        <MutationError message={t(apiErrorMessageKey(mutation.error))} />
      )}

      <MemberProfilePhotoEditor profile={profile} variant="onboarding" />

      <section aria-labelledby="onboarding-professional-fields">
        <h2 id="onboarding-professional-fields" className="sr-only">
          {t("dinee.onboardingIdentityTitle")}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="onboarding-profile-first_name"
            label={t("dinee.firstName")}
            required
            error={fieldError("first_name")}
          >
            {input(
              "first_name",
              "text",
              "given-name",
              <UserIcon aria-hidden="true" className="size-5" />,
              t("dinee.firstName"),
            )}
          </FormField>
          <FormField
            id="onboarding-profile-last_name"
            label={t("dinee.lastName")}
            required
            error={fieldError("last_name")}
          >
            {input(
              "last_name",
              "text",
              "family-name",
              <UserIcon aria-hidden="true" className="size-5" />,
              t("dinee.lastName"),
            )}
          </FormField>
          <FormField
            id="onboarding-profile-job_title"
            label={t("dinee.jobTitle")}
            error={fieldError("job_title")}
          >
            {input(
              "job_title",
              "text",
              "organization-title",
              <DineeEditIcon aria-hidden="true" className="size-5" />,
              t("dinee.jobTitle"),
            )}
          </FormField>
          <FormField
            id="onboarding-profile-company"
            label={t("dinee.company")}
            error={fieldError("company")}
          >
            {input(
              "company",
              "text",
              "organization",
              <DineeCompanyIcon aria-hidden="true" className="size-5" />,
              t("dinee.company"),
            )}
          </FormField>
          <FormField
            id="onboarding-profile-sector"
            label={t("dinee.sector")}
            error={fieldError("sector")}
            className="sm:col-span-2"
          >
            {input(
              "sector",
              "text",
              undefined,
              <GlobeIcon aria-hidden="true" className="size-5" />,
              t("dinee.sector"),
            )}
          </FormField>
          <FormField
            id="onboarding-profile-bio"
            label={t("dinee.bio")}
            hint={t("dinee.onboardingBioHint")}
            error={fieldError("bio")}
            className="sm:col-span-2"
          >
            <div className="relative">
              <DineeEditIcon
                aria-hidden="true"
                className="pointer-events-none absolute start-4 top-4 size-5 text-gray-400 dark:text-gray-500"
              />
              <textarea
                id="onboarding-profile-bio"
                rows={4}
                maxLength={1000}
                value={form.bio}
                onChange={(event) => set("bio", event.target.value)}
                className={cn(
                  textAreaClass(Boolean(fieldError("bio"))),
                  "ps-11",
                )}
                aria-invalid={Boolean(fieldError("bio"))}
                placeholder={t("dinee.bio")}
              />
            </div>
          </FormField>
          <FormField
            id="onboarding-profile-linkedin_url"
            label={t("dinee.linkedin")}
            hint={t("dinee.linkedinProfileHint")}
            error={fieldError("linkedin_url")}
            className="sm:col-span-2"
          >
            {input(
              "linkedin_url",
              "url",
              "url",
              <GlobeIcon aria-hidden="true" className="size-5" />,
              "https://linkedin.com/in/...",
            )}
          </FormField>
        </div>
      </section>

      <footer className="sticky bottom-0 z-9 -mx-5 bg-gray-25/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Link
            to="/onboarding"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-gray-600 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white"
          >
            <DineeChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("dinee.onboardingBack")}
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 text-sm font-semibold text-white shadow-theme-sm transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
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
