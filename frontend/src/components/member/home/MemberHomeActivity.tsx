import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { DineeArrowRightIcon } from "@/icons";
import type { ProfileHistoryEntry } from "@/types/dinee";

export default function MemberHomeActivity({
  entries,
}: {
  entries: ProfileHistoryEntry[];
}) {
  const { t, i18n } = useTranslation();
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="member-recent-activity">
      <div className="flex items-center justify-between gap-4">
        <h2 id="member-recent-activity" className="text-lg font-semibold text-gray-950 dark:text-white">
          {t("dinee.memberHomeRecentActivity")}
        </h2>
        <Link to="/member/history" className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          {t("dinee.memberHomeViewHistory")}
        </Link>
      </div>
      <ol className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {entries.slice(0, 3).map((entry) => (
          <li key={entry.event_id} className="flex items-center gap-4 py-4">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {entry.event_title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t(`dinee.history_${entry.status}`)}
                {entry.starts_at && (
                  <> · {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(entry.starts_at))}</>
                )}
              </p>
            </div>
            <DineeArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-gray-400 rtl:rotate-180" />
          </li>
        ))}
      </ol>
    </section>
  );
}
