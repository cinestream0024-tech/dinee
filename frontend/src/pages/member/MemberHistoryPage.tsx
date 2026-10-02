import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import { useLanguage } from "@/context/LanguageContext";
import {
  getMemberHistory,
  memberHistoryKey,
} from "@/features/profiles/api";
import {
  DineeAlertIcon,
  DineeCalendarIcon,
  DineeHistoryIcon,
  DineeMapPinIcon,
} from "@/icons";
import type { ProfileHistoryEntry } from "@/types/dinee";

const statusClass: Record<ProfileHistoryEntry["status"], string> = {
  selected:
    "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-300",
  withdrawn:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  pending:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
  accepted:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300",
  declined:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300",
  cancelled:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  present:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300",
  absent:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300",
};

const dotClass: Record<ProfileHistoryEntry["status"], string> = {
  selected: "border-blue-light-200 bg-blue-light-500 dark:border-blue-light-800",
  withdrawn: "border-gray-200 bg-gray-400 dark:border-gray-700",
  pending: "border-warning-200 bg-warning-500 dark:border-warning-800",
  accepted: "border-success-200 bg-success-500 dark:border-success-800",
  declined: "border-error-200 bg-error-500 dark:border-error-800",
  cancelled: "border-gray-200 bg-gray-400 dark:border-gray-700",
  present: "border-success-200 bg-success-500 dark:border-success-800",
  absent: "border-error-200 bg-error-500 dark:border-error-800",
};

function HistorySkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-label={t("dinee.loading")} className="animate-pulse">
      <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-6 space-y-5 border-s border-gray-200 ps-7 dark:border-gray-800">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-3 py-2">
            <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-900" />
            <div className="h-7 w-24 rounded-lg bg-gray-100 dark:bg-gray-900" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({
  id,
  title,
  entries,
}: {
  id: string;
  title: string;
  entries: ProfileHistoryEntry[];
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date(value))
      : t("dinee.unscheduled");

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-2">
        <DineeCalendarIcon
          aria-hidden="true"
          className="size-5 text-brand-600 dark:text-brand-400"
        />
        <h2 id={id} className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      <ol className="relative mt-5 ms-2 border-s border-gray-200 dark:border-gray-800">
        {entries.map((entry) => (
          <li key={entry.event_id} className="relative pb-8 ps-7 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute -start-2 top-1.5 size-4 rounded-full border-4 ${dotClass[entry.status]}`}
            />
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {entry.event_title}
                  </h3>
                  <time
                    dateTime={entry.starts_at ?? undefined}
                    className="mt-1.5 block text-sm leading-6 text-gray-500 dark:text-gray-400"
                  >
                    {formatDate(entry.starts_at)}
                  </time>
                </div>
                <span
                  className={`inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-theme-xs font-semibold ${statusClass[entry.status]}`}
                >
                  {t(`dinee.history_${entry.status}`)}
                </span>
              </div>

              {entry.location && (
                <p className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                  <DineeMapPinIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-gray-400"
                  />
                  <span>{entry.location}</span>
                </p>
              )}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function MemberHistoryPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: memberHistoryKey,
    queryFn: getMemberHistory,
  });

  const referenceTime = query.dataUpdatedAt;
  const upcoming = (query.data ?? [])
    .filter(
      (entry) =>
        entry.starts_at &&
        new Date(entry.starts_at).getTime() >= referenceTime &&
        !["completed", "cancelled"].includes(entry.event_status),
    )
    .sort(
      (first, second) =>
        new Date(first.starts_at!).getTime() -
        new Date(second.starts_at!).getTime(),
    );
  const past = (query.data ?? []).filter(
    (entry) => !upcoming.some((item) => item.event_id === entry.event_id),
  );

  return (
    <>
      <PageMeta
        title={`${t("dinee.myHistory")} | ${t("dinee.brand")}`}
        description={t("dinee.memberHistorySubtitle")}
      />

      <header className="mb-8">
        <p className="text-sm font-medium tracking-widest text-brand-600 uppercase dark:text-brand-400">
          {t("dinee.myHistory")}
        </p>
        <h1 className="mt-3 text-title-sm font-semibold text-gray-950 sm:text-title-md dark:text-white">
          {t("dinee.memberHistoryTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300">
          {t("dinee.memberHistorySubtitle")}
        </p>
      </header>

      {query.isPending && <HistorySkeleton />}

      {query.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <DineeAlertIcon aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("dinee.memberHistoryError")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("dinee.networkError")}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-5 min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {t("dinee.retry")}
          </button>
        </div>
      )}

      {query.data?.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <DineeHistoryIcon aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("dinee.memberHistoryEmpty")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("dinee.memberHistoryEmptyDescription")}
          </p>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <div className="space-y-10">
          <Timeline
            id="upcoming-history"
            title={t("dinee.upcomingHistory")}
            entries={upcoming}
          />
          <Timeline
            id="past-history"
            title={t("dinee.pastHistory")}
            entries={past}
          />
        </div>
      )}
    </>
  );
}
