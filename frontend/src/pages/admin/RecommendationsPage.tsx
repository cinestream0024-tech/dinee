import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import AdminRecommendationReview from "@/components/recommendations/AdminRecommendationReview";
import {
  listAdminRecommendations,
  recommendationKeys,
} from "@/features/recommendations/api";
import type { RecommendationStatus } from "@/types/dinee";

const statusClass = {
  pending: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
  accepted: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300",
  rejected: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function RecommendationsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<RecommendationStatus | "">("pending");
  const query = useQuery({
    queryKey: recommendationKeys.admin(status),
    queryFn: () => listAdminRecommendations(status),
  });

  return (
    <>
      <PageMeta title={`${t("dinee.recommendations")} | ${t("dinee.brand")}`} description={t("dinee.adminRecommendationsSubtitle")} />
      <PageBreadCrumb pageTitle={t("dinee.recommendations")} />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-950 dark:text-white">{t("dinee.recommendations")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{t("dinee.adminRecommendationsSubtitle")}</p>
        </div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("dinee.status")}
          <select value={status} onChange={(event) => setStatus(event.target.value as RecommendationStatus | "")} className="mt-1 block min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="">{t("dinee.allStatuses")}</option>
            <option value="pending">{t("dinee.recommendationStatus_pending")}</option>
            <option value="accepted">{t("dinee.recommendationStatus_accepted")}</option>
            <option value="rejected">{t("dinee.recommendationStatus_rejected")}</option>
          </select>
        </label>
      </div>

      {query.isPending && <div role="status" aria-label={t("dinee.loading")} className="space-y-4 animate-pulse"><div className="h-56 rounded-3xl bg-gray-100 dark:bg-gray-800" /><div className="h-56 rounded-3xl bg-gray-100 dark:bg-gray-800" /></div>}
      {query.isError && <div role="alert" className="rounded-2xl bg-error-50 p-5 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-300">{t("dinee.loadFailed")}</div>}
      {query.data?.data.length === 0 && <div className="rounded-3xl bg-white px-6 py-14 text-center text-sm text-gray-500 shadow-theme-xs dark:bg-white/[0.03] dark:text-gray-400">{t("dinee.noRecommendations")}</div>}

      <div className="space-y-4">
        {query.data?.data.map((recommendation) => (
          <article key={recommendation.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{recommendation.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{recommendation.job_title} · {recommendation.company}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-theme-xs font-semibold ${statusClass[recommendation.status]}`}>{t(`dinee.recommendationStatus_${recommendation.status}`)}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-gray-700 dark:text-gray-300">{recommendation.reason}</p>
            <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">{t("dinee.recommendedBy", { name: recommendation.recommender.name })}</p>
            {recommendation.potential_duplicates.length > 0 && recommendation.status === "pending" && (
              <p className="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-sm text-warning-800 dark:bg-warning-500/10 dark:text-warning-200">{t("dinee.potentialDuplicateFound")}</p>
            )}
            <AdminRecommendationReview recommendation={recommendation} />
          </article>
        ))}
      </div>
    </>
  );
}
