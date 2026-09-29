import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import FormField from "@/components/admin/FormField";
import { MutationError } from "@/components/admin/AsyncState";
import {
  apiErrorMessageKey,
  hasFieldError,
} from "@/components/admin/apiErrors";
import { controlClass, textAreaClass } from "@/components/admin/formStyles";
import MemberProfileSection from "@/components/member/MemberProfileSection";
import { memberProfileKey, updateMemberProfile } from "@/features/profiles/api";
import type { Profile } from "@/types/dinee";

interface FormState {
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  sector: string;
  bio: string;
  interests: string;
  looking_for: string;
  contributions: string;
  email: string;
  phone: string;
  linkedin_url: string;
}

const fromProfile = (profile: Profile): FormState => ({
  first_name: profile.first_name,
  last_name: profile.last_name,
  company: profile.company ?? "",
  job_title: profile.job_title ?? "",
  sector: profile.sector ?? "",
  bio: profile.bio ?? "",
  interests: profile.interests ?? "",
  looking_for: profile.looking_for ?? "",
  contributions: profile.contributions ?? "",
  email: profile.email ?? "",
  phone: profile.phone ?? "",
  linkedin_url: profile.linkedin_url ?? "",
});

const nullable = (value: string) => value.trim() || null;

export default function MemberProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [form, setForm] = useState<FormState>(() => fromProfile(profile));
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

  const set = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const fieldError = (field: keyof FormState) =>
    clientErrors[field] ||
    (hasFieldError(mutation.error, field)
      ? t("dinee.invalidField")
      : undefined);

  const input = (
    field: keyof FormState,
    type = "text",
    autoComplete?: string,
  ) => {
    const id = `member-profile-${field}`;
    return (
      <input
        id={id}
        type={type}
        value={form[field]}
        onChange={(event) => set(field, event.target.value)}
        className={controlClass(Boolean(fieldError(field)))}
        aria-invalid={Boolean(fieldError(field))}
        aria-describedby={fieldError(field) ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        required={field === "first_name" || field === "last_name"}
      />
    );
  };

  const area = (field: keyof FormState, rows = 4) => {
    const id = `member-profile-${field}`;
    return (
      <textarea
        id={id}
        rows={rows}
        value={form[field]}
        onChange={(event) => set(field, event.target.value)}
        className={textAreaClass(Boolean(fieldError(field)))}
        aria-invalid={Boolean(fieldError(field))}
        aria-describedby={fieldError(field) ? `${id}-error` : undefined}
      />
    );
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = t("dinee.requiredField");
    if (!form.last_name.trim()) errors.last_name = t("dinee.requiredField");
    if (Object.keys(errors).length) {
      setClientErrors(errors);
      document
        .getElementById(`member-profile-${Object.keys(errors)[0]}`)
        ?.focus();
      return;
    }

    mutation.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      company: nullable(form.company),
      job_title: nullable(form.job_title),
      sector: nullable(form.sector),
      bio: nullable(form.bio),
      interests: nullable(form.interests),
      looking_for: nullable(form.looking_for),
      contributions: nullable(form.contributions),
      email: nullable(form.email),
      phone: nullable(form.phone),
      linkedin_url: nullable(form.linkedin_url),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {mutation.isError && (
        <MutationError message={t(apiErrorMessageKey(mutation.error))} />
      )}

      <MemberProfileSection title={t("dinee.essentialInformation")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="member-profile-first_name"
            label={t("dinee.firstName")}
            required
            error={fieldError("first_name")}
          >
            {input("first_name", "text", "given-name")}
          </FormField>
          <FormField
            id="member-profile-last_name"
            label={t("dinee.lastName")}
            required
            error={fieldError("last_name")}
          >
            {input("last_name", "text", "family-name")}
          </FormField>
          <FormField
            id="member-profile-job_title"
            label={t("dinee.jobTitle")}
            error={fieldError("job_title")}
          >
            {input("job_title", "text", "organization-title")}
          </FormField>
          <FormField
            id="member-profile-company"
            label={t("dinee.company")}
            error={fieldError("company")}
          >
            {input("company", "text", "organization")}
          </FormField>
          <FormField
            id="member-profile-sector"
            label={t("dinee.sector")}
            error={fieldError("sector")}
            className="sm:col-span-2"
          >
            {input("sector")}
          </FormField>
        </div>
      </MemberProfileSection>

      <MemberProfileSection title={t("dinee.aboutMe")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="member-profile-bio"
            label={t("dinee.bio")}
            error={fieldError("bio")}
          >
            {area("bio")}
          </FormField>
          <FormField
            id="member-profile-interests"
            label={t("dinee.myInterests")}
            error={fieldError("interests")}
          >
            {area("interests")}
          </FormField>
        </div>
      </MemberProfileSection>

      <MemberProfileSection title={t("dinee.professionalIntentions")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="member-profile-looking_for"
            label={t("dinee.whatILookFor")}
            error={fieldError("looking_for")}
          >
            {area("looking_for")}
          </FormField>
          <FormField
            id="member-profile-contributions"
            label={t("dinee.whatIBring")}
            error={fieldError("contributions")}
          >
            {area("contributions")}
          </FormField>
        </div>
      </MemberProfileSection>

      <MemberProfileSection title={t("dinee.contactDetails")}>
        <p className="mb-5 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {t("dinee.privateContactNotice")}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="member-profile-email"
            label={t("dinee.email")}
            error={fieldError("email")}
          >
            {input("email", "email", "email")}
          </FormField>
          <FormField
            id="member-profile-phone"
            label={t("dinee.phone")}
            hint={t("dinee.phoneHint")}
            error={fieldError("phone")}
          >
            {input("phone", "tel", "tel")}
          </FormField>
          <FormField
            id="member-profile-linkedin_url"
            label={t("dinee.linkedin")}
            error={fieldError("linkedin_url")}
            className="sm:col-span-2"
          >
            {input("linkedin_url", "url", "url")}
          </FormField>
        </div>
      </MemberProfileSection>

      <footer className="sticky bottom-0 z-9 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border dark:border-gray-800 dark:bg-gray-950/95">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/member/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("dinee.cancel")}
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? t("dinee.saving") : t("dinee.save")}
          </button>
        </div>
      </footer>
    </form>
  );
}
