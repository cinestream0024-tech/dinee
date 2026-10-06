import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import MemberRecommendationForm from "@/components/recommendations/MemberRecommendationForm";
import {
  listMemberRecommendations,
  recommendationKeys,
} from "@/features/recommendations/api";

const statusClass = {
  pending: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
  accepted: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300",
  rejected: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function MemberRecommendationsPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: recommendationKeys.member(),
    queryFn: listMemberRecommendations,
  });

  return (
    <>
      <PageMeta title={`${t("dinee.recommendSomeone")} | ${t("dinee.brand")}`} description={t("dinee.recommendationIntro")} />
      <header className="mb-8">
        <p className="text-sm font-medium tracking-widest text-brand-600 uppercase dark:text-brand-400">
          {t("dinee.privateNetwork")}
        </p>
        <h1 className="mt-3 text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
          {t("dinee.recommendSomeone")}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300">
          {t("dinee.recommendationIntro")}
        </p>
      </header>

      <MemberRecommendationForm />

      {query.data && query.data.length > 0 && (
        <section className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
            {t("dinee.myRecommendations")}
          </h2>
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {query.data.map((recommendation) => (
              <article key={recommendation.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white">{recommendation.name}</h3>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {recommendation.job_title} · {recommendation.company}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-theme-xs font-semibold ${statusClass[recommendation.status]}`}>
                  {t(`dinee.recommendationStatus_${recommendation.status}`)}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
