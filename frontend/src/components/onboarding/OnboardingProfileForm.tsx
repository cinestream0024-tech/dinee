import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import FormField from "@/components/admin/FormField";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey, hasFieldError } from "@/components/admin/apiErrors";
import MemberProfilePhotoEditor from "@/components/member/MemberProfilePhotoEditor";
import { memberProfileKey, updateMemberProfile } from "@/features/profiles/api";
import { DineeArrowRightIcon, DineeChevronLeftIcon } from "@/icons";
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
    "h-13 w-full rounded-2xl border bg-gray-25 px-4 text-base text-gray-950 outline-hidden transition placeholder:text-gray-400 focus:bg-white focus:ring-3 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900",
    hasError
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
      : "border-gray-200 focus:border-brand-300 focus:ring-brand-500/15 dark:border-gray-700 dark:focus:border-brand-700",
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
  ) => {
    const id = `onboarding-profile-${field}`;
    return (
      <input
        id={id}
        type={type}
        value={form[field]}
        onChange={(event) => set(field, event.target.value)}
        className={controlClass(Boolean(fieldError(field)))}
        aria-invalid={Boolean(fieldError(field))}
        autoComplete={autoComplete}
        required={field === "first_name" || field === "last_name"}
      />
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

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-7 dark:border-gray-800 dark:bg-white/3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
          {t("dinee.onboardingIdentityTitle")}
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {t("dinee.onboardingIdentityDescription")}
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <FormField
            id="onboarding-profile-first_name"
            label={t("dinee.firstName")}
            required
            error={fieldError("first_name")}
          >
            {input("first_name", "text", "given-name")}
          </FormField>
          <FormField
            id="onboarding-profile-last_name"
            label={t("dinee.lastName")}
            required
            error={fieldError("last_name")}
          >
            {input("last_name", "text", "family-name")}
          </FormField>
          <FormField
            id="onboarding-profile-job_title"
            label={t("dinee.jobTitle")}
            error={fieldError("job_title")}
          >
            {input("job_title", "text", "organization-title")}
          </FormField>
          <FormField
            id="onboarding-profile-company"
            label={t("dinee.company")}
            error={fieldError("company")}
          >
            {input("company", "text", "organization")}
          </FormField>
          <FormField
            id="onboarding-profile-sector"
            label={t("dinee.sector")}
            error={fieldError("sector")}
            className="sm:col-span-2"
          >
            {input("sector")}
          </FormField>
          <FormField
            id="onboarding-profile-bio"
            label={t("dinee.bio")}
            hint={t("dinee.onboardingBioHint")}
            error={fieldError("bio")}
            className="sm:col-span-2"
          >
            <textarea
              id="onboarding-profile-bio"
              rows={4}
              maxLength={1000}
              value={form.bio}
              onChange={(event) => set("bio", event.target.value)}
              className={textAreaClass(Boolean(fieldError("bio")))}
              aria-invalid={Boolean(fieldError("bio"))}
            />
          </FormField>
          <FormField
            id="onboarding-profile-linkedin_url"
            label={t("dinee.linkedin")}
            hint={t("dinee.linkedinProfileHint")}
            error={fieldError("linkedin_url")}
            className="sm:col-span-2"
          >
            {input("linkedin_url", "url", "url")}
          </FormField>
        </div>
      </section>

      <footer className="sticky bottom-0 z-9 -mx-5 border-t border-gray-200 bg-gray-25/95 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <Link
            to="/onboarding"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-gray-600 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white"
          >
            <DineeChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("dinee.back")}
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
