import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  acceptRecommendation,
  recommendationKeys,
  rejectRecommendation,
} from "@/features/recommendations/api";
import type { AdminRecommendation } from "@/types/dinee";

export default function AdminRecommendationReview({
  recommendation,
}: {
  recommendation: AdminRecommendation;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [mode, setMode] = useState<"idle" | "accept" | "reject">("idle");
  const [existingId, setExistingId] = useState("");
  const names = recommendation.name.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(names.shift() ?? "");
  const [lastName, setLastName] = useState(names.join(" "));
  const mutation = useMutation({
    mutationFn: async (action: "accept" | "reject") =>
      action === "reject"
        ? rejectRecommendation(recommendation.id)
        : acceptRecommendation(
            recommendation.id,
            existingId
              ? { existing_profile_id: Number(existingId) }
              : { first_name: firstName, last_name: lastName },
          ),
    onSuccess: async () => {
      setMode("idle");
      await client.invalidateQueries({ queryKey: recommendationKeys.all });
    },
  });

  if (recommendation.status !== "pending") return null;

  if (mode === "accept") {
    return (
      <div className="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
        {recommendation.potential_duplicates.length > 0 && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.recommendationProfileChoice")}
            <select value={existingId} onChange={(event) => setExistingId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option value="">{t("dinee.createNewProfile")}</option>
              {recommendation.potential_duplicates.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {t("dinee.linkExistingProfile", { name: profile.name })}
                </option>
              ))}
            </select>
          </label>
        )}
        {!existingId && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dinee.firstName")}
              <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dinee.lastName")}
              <input required value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
            </label>
          </div>
        )}
        {mutation.isError && <p role="alert" className="mt-3 text-sm text-error-600 dark:text-error-400">{t("dinee.unexpectedError")}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={mutation.isPending || (!existingId && (!firstName || !lastName))} onClick={() => mutation.mutate("accept")} className="min-h-11 rounded-xl bg-success-600 px-4 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60">
            {t("dinee.confirmAcceptance")}
          </button>
          <button type="button" onClick={() => setMode("idle")} className="min-h-11 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            {t("dinee.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="mt-5 rounded-2xl bg-error-50 p-4 dark:bg-error-500/10">
        <p className="text-sm font-medium text-error-800 dark:text-error-200">{t("dinee.confirmRecommendationRejection")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate("reject")} className="min-h-11 rounded-xl bg-error-600 px-4 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-60">
            {t("dinee.confirmRejection")}
          </button>
          <button type="button" onClick={() => setMode("idle")} className="min-h-11 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800">
            {t("dinee.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" onClick={() => setMode("accept")} className="min-h-11 rounded-xl bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950">
        {t("dinee.acceptRecommendation")}
      </button>
      <button type="button" onClick={() => setMode("reject")} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10">
        {t("dinee.rejectRecommendation")}
      </button>
    </div>
  );
}
