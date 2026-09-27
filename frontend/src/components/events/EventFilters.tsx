import { useTranslation } from "react-i18next";
import { controlClass } from "@/components/admin/formStyles";
import { DineeFilterIcon, DineeResetIcon, DineeSearchIcon } from "@/icons";
import type { EventPeriod, EventStatus } from "@/types/dinee";

interface Props {
  q: string;
  status: EventStatus | "";
  period: EventPeriod | "";
  hasFilters: boolean;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

const periods: Array<EventPeriod | ""> = ["", "future", "past", "unscheduled"];

export default function EventFilters({
  q,
  status,
  period,
  hasFilters,
  onChange,
  onReset,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <DineeFilterIcon
          aria-hidden="true"
          className="me-1 size-4 shrink-0 text-gray-400"
        />
        {periods.map((value) => {
          const active = period === value;
          const label = value ? t(`dinee.${value}`) : t("dinee.allPeriods");
          return (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange("period", value)}
              className={`min-h-9 shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-gray-900 text-white shadow-theme-xs dark:bg-white dark:text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_13rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onChange("q", String(data.get("q") ?? "").trim());
        }}
      >
        <label className="relative block">
          <span className="sr-only">{t("dinee.searchEvents")}</span>
          <DineeSearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
          />
          <input
            key={q}
            name="q"
            defaultValue={q}
            placeholder={t("dinee.searchEvents")}
            className={`${controlClass()} ps-10`}
          />
        </label>
        <label>
          <span className="sr-only">{t("dinee.status")}</span>
          <select
            value={status}
            onChange={(event) => onChange("status", event.target.value)}
            className={controlClass()}
          >
            <option value="">{t("dinee.allStatuses")}</option>
            {(["draft", "upcoming", "completed", "cancelled"] as const).map(
              (value) => (
                <option key={value} value={value}>
                  {t(`dinee.status_${value}`)}
                </option>
              ),
            )}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <DineeSearchIcon aria-hidden="true" className="size-4" />
            {t("dinee.search")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              title={t("dinee.reset")}
              aria-label={t("dinee.reset")}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <DineeResetIcon aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
