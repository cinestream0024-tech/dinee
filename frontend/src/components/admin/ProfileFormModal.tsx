import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import { controlClass, textAreaClass } from "@/components/admin/formStyles";
import { MutationError } from "@/components/admin/AsyncState";
import {
  apiErrorMessageKey,
  hasFieldError,
} from "@/components/admin/apiErrors";
import { saveProfile } from "@/features/profiles/api";
import type { Availability, Profile, ProfilePayload } from "@/types/dinee";

interface ProfileFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  company: string;
  job_title: string;
  sector: string;
  bio: string;
  interests: string;
  looking_for: string;
  contributions: string;
  availability: Availability;
}

const emptyForm: ProfileFormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  linkedin_url: "",
  company: "",
  job_title: "",
  sector: "",
  bio: "",
  interests: "",
  looking_for: "",
  contributions: "",
  availability: "unspecified",
};

function fromProfile(profile: Profile | null): ProfileFormState {
  if (!profile) return emptyForm;
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    company: profile.company ?? "",
    job_title: profile.job_title ?? "",
    sector: profile.sector ?? "",
    bio: profile.bio ?? "",
    interests: profile.interests ?? "",
    looking_for: profile.looking_for ?? "",
    contributions: profile.contributions ?? "",
    availability: profile.availability,
  };
}

const nullable = (value: string) => value.trim() || null;

export default function ProfileFormModal({
  isOpen,
  profile,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ProfileFormState>(() =>
    fromProfile(profile),
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (payload: ProfilePayload) => saveProfile(payload, profile?.id),
    onSuccess: ({ data }) => onSaved(data),
  });

  const set = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const fieldError = (field: keyof ProfileFormState) =>
    clientErrors[field] ||
    (hasFieldError(mutation.error, field)
      ? t("dinee.invalidField")
      : undefined);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = t("dinee.requiredField");
    if (!form.last_name.trim()) errors.last_name = t("dinee.requiredField");
    if (Object.keys(errors).length) {
      setClientErrors(errors);
      return;
    }

    mutation.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: nullable(form.email),
      phone: nullable(form.phone),
      linkedin_url: nullable(form.linkedin_url),
      company: nullable(form.company),
      job_title: nullable(form.job_title),
      sector: nullable(form.sector),
      bio: nullable(form.bio),
      interests: nullable(form.interests),
      looking_for: nullable(form.looking_for),
      contributions: nullable(form.contributions),
      availability: form.availability,
    });
  };

  const input = (
    field: keyof ProfileFormState,
    id: string,
    type = "text",
    autoComplete?: string,
  ) => (
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

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      busy={mutation.isPending}
      title={t(profile ? "dinee.editProfile" : "dinee.newProfile")}
      description={t("dinee.profileFormDescription")}
      width="max-w-4xl"
    >
      <form onSubmit={submit} noValidate>
        <div className="space-y-7 p-5 sm:p-6">
          {mutation.isError && (
            <MutationError message={t(apiErrorMessageKey(mutation.error))} />
          )}

          <fieldset>
            <legend className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.identityAndContact")}
            </legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                id="profile-first-name"
                label={t("dinee.firstName")}
                required
                error={fieldError("first_name")}
              >
                {input(
                  "first_name",
                  "profile-first-name",
                  "text",
                  "given-name",
                )}
              </FormField>
              <FormField
                id="profile-last-name"
                label={t("dinee.lastName")}
                required
                error={fieldError("last_name")}
              >
                {input("last_name", "profile-last-name", "text", "family-name")}
              </FormField>
              <FormField
                id="profile-email"
                label={t("dinee.email")}
                error={fieldError("email")}
              >
                {input("email", "profile-email", "email", "email")}
              </FormField>
              <FormField
                id="profile-phone"
                label={t("dinee.phone")}
                error={fieldError("phone")}
                hint={t("dinee.phoneHint")}
              >
                {input("phone", "profile-phone", "tel", "tel")}
              </FormField>
              <FormField
                id="profile-linkedin"
                label={t("dinee.linkedin")}
                error={fieldError("linkedin_url")}
                className="sm:col-span-2"
              >
                {input("linkedin_url", "profile-linkedin", "url", "url")}
              </FormField>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.professionalInformation")}
            </legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                id="profile-company"
                label={t("dinee.company")}
                error={fieldError("company")}
              >
                {input("company", "profile-company", "text", "organization")}
              </FormField>
              <FormField
                id="profile-job-title"
                label={t("dinee.jobTitle")}
                error={fieldError("job_title")}
              >
                {input(
                  "job_title",
                  "profile-job-title",
                  "text",
                  "organization-title",
                )}
              </FormField>
              <FormField
                id="profile-sector"
                label={t("dinee.sector")}
                error={fieldError("sector")}
              >
                {input("sector", "profile-sector")}
              </FormField>
              <FormField
                id="profile-availability"
                label={t("dinee.availability")}
              >
                <select
                  id="profile-availability"
                  value={form.availability}
                  onChange={(event) => set("availability", event.target.value)}
                  className={controlClass()}
                >
                  <option value="unspecified">
                    {t("dinee.availability_unspecified")}
                  </option>
                  <option value="available">
                    {t("dinee.availability_available")}
                  </option>
                  <option value="temporarily_unavailable">
                    {t("dinee.availability_temporarily_unavailable")}
                  </option>
                </select>
              </FormField>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.networkContext")}
            </legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {(
                [
                  ["bio", "bio"],
                  ["interests", "interests"],
                  ["looking_for", "lookingFor"],
                  ["contributions", "contributions"],
                ] as const
              ).map(([field, label]) => (
                <FormField
                  key={field}
                  id={`profile-${field}`}
                  label={t(`dinee.${label}`)}
                  error={fieldError(field)}
                >
                  <textarea
                    id={`profile-${field}`}
                    rows={4}
                    value={form[field]}
                    onChange={(event) => set(field, event.target.value)}
                    className={textAreaClass(Boolean(fieldError(field)))}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={
                      fieldError(field) ? `profile-${field}-error` : undefined
                    }
                  />
                </FormField>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {t("dinee.cancel")}
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? t("dinee.saving") : t("dinee.save")}
          </button>
        </footer>
      </form>
    </AdminModal>
  );
}
