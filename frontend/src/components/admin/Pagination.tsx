import { DineeChevronLeftIcon, DineeChevronRightIcon } from "@/icons";
import type { PaginationMeta } from "@/types/dinee";
import { useTranslation } from "react-i18next";

export default function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (meta.last_page <= 1) return null;

  return (
    <nav
      aria-label={t("dinee.pagination")}
      className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
    >
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        {t("dinee.pageSummary", {
          current: meta.current_page,
          total: meta.last_page,
          count: meta.total,
        })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <DineeChevronLeftIcon className="size-4 rtl:rotate-180" />
          {t("dinee.previous")}
        </button>
        <button
          type="button"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {t("dinee.next")}
          <DineeChevronRightIcon className="size-4 rtl:rotate-180" />
        </button>
      </div>
    </nav>
  );
}
