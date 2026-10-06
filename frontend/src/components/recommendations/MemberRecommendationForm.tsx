import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  recommendationKeys,
  submitRecommendation,
} from "@/features/recommendations/api";
import { ApiError } from "@/services/api";
import type { RecommendationPayload } from "@/types/dinee";

const emptyForm: RecommendationPayload = {
  name: "",
  job_title: "",
  company: "",
  email: null,
  phone: null,
  linkedin_url: null,
  reason: "",
};

export default function MemberRecommendationForm() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState(false);
  const mutation = useMutation({
    mutationFn: submitRecommendation,
    onSuccess: async () => {
      setForm(emptyForm);
      setSuccess(true);
      await client.invalidateQueries({ queryKey: recommendationKeys.member() });
    },
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const update = (field: keyof RecommendationPayload, value: string) => {
    setSuccess(false);
    setForm((current) => ({ ...current, [field]: value || null }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  const fieldError = (field: keyof RecommendationPayload) =>
    apiError?.errors[field]?.length ? t("dinee.invalidField") : undefined;

  return (
    <form onSubmit={submit} className="space-y-5">
      {success && (
        <p role="status" className="rounded-2xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700 dark:bg-success-500/15 dark:text-success-300">
          {t("dinee.recommendationSubmitted")}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="rounded-2xl bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-300">
          {apiError?.errors.contact
            ? t("dinee.recommendationDuplicate")
            : t("dinee.reviewFields")}
        </p>
      )}

      <div>
        <Label htmlFor="recommendation-name">{t("dinee.recommendedName")}</Label>
        <Input id="recommendation-name" required value={form.name} onChange={(event) => update("name", event.target.value)} hint={fieldError("name")} error={Boolean(fieldError("name"))} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="recommendation-role">{t("dinee.jobTitle")}</Label>
          <Input id="recommendation-role" required value={form.job_title} onChange={(event) => update("job_title", event.target.value)} hint={fieldError("job_title")} error={Boolean(fieldError("job_title"))} />
        </div>
        <div>
          <Label htmlFor="recommendation-company">{t("dinee.company")}</Label>
          <Input id="recommendation-company" required value={form.company} onChange={(event) => update("company", event.target.value)} hint={fieldError("company")} error={Boolean(fieldError("company"))} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="recommendation-email">{t("dinee.email")}</Label>
          <Input id="recommendation-email" type="email" value={form.email ?? ""} onChange={(event) => update("email", event.target.value)} hint={fieldError("email")} error={Boolean(fieldError("email"))} />
        </div>
        <div>
          <Label htmlFor="recommendation-phone">{t("dinee.phone")}</Label>
          <Input id="recommendation-phone" type="tel" placeholder="+243…" value={form.phone ?? ""} onChange={(event) => update("phone", event.target.value)} hint={fieldError("phone")} error={Boolean(fieldError("phone"))} />
        </div>
      </div>
      <div>
        <Label htmlFor="recommendation-linkedin">{t("dinee.linkedin")}</Label>
        <Input id="recommendation-linkedin" type="url" placeholder="https://www.linkedin.com/in/…" value={form.linkedin_url ?? ""} onChange={(event) => update("linkedin_url", event.target.value)} hint={fieldError("linkedin_url")} error={Boolean(fieldError("linkedin_url"))} />
      </div>
      <div>
        <Label htmlFor="recommendation-reason">{t("dinee.recommendationReason")}</Label>
        <textarea
          id="recommendation-reason"
          required
          minLength={10}
          rows={5}
          value={form.reason}
          onChange={(event) => update("reason", event.target.value)}
          placeholder={t("dinee.recommendationReasonPlaceholder")}
          className={`w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-3 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600 ${fieldError("reason") ? "border-error-500 focus:border-error-400 focus:ring-error-500/10" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
        />
        {fieldError("reason") && <p className="mt-1.5 text-xs text-error-500">{fieldError("reason")}</p>}
      </div>
      <button type="submit" disabled={mutation.isPending} className="min-h-13 w-full rounded-2xl bg-gray-950 px-6 text-base font-semibold text-white shadow-theme-md transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100">
        {mutation.isPending ? t("dinee.saving") : t("dinee.submitRecommendation")}
      </button>
    </form>
  );
}
