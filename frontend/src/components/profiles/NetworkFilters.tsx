import { useTranslation } from "react-i18next";
import { controlClass } from "@/components/admin/formStyles";
import { DineeResetIcon, DineeSearchIcon } from "@/icons";
import type { Availability } from "@/types/dinee";

interface NetworkFiltersProps {
  q: string;
  availability: Availability | "";
  hasFilters: boolean;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

const availabilityOptions: Array<Availability | ""> = [
  "",
  "available",
  "temporarily_unavailable",
  "unspecified",
];

export default function NetworkFilters({
  q,
  availability,
  hasFilters,
  onChange,
  onReset,
}: NetworkFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
      <form
        className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onChange("q", String(data.get("q") ?? "").trim());
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-theme-xs font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.searchNetwork")}
          </span>
          <span className="relative block">
            <DineeSearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
            />
            <input
              key={q}
              name="q"
              defaultValue={q}
              placeholder={t("dinee.searchNetwork")}
              className={`${controlClass()} ps-10`}
            />
          </span>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 lg:flex-none dark:bg-white/10 dark:hover:bg-white/15"
          >
            <DineeSearchIcon aria-hidden="true" className="size-4" />
            {t("dinee.search")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <DineeResetIcon aria-hidden="true" className="size-4" />
              {t("dinee.reset")}
            </button>
          )}
        </div>
      </form>

      <fieldset className="mt-4">
        <legend className="mb-2 text-theme-xs font-medium text-gray-700 dark:text-gray-300">
          {t("dinee.availability")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((value) => {
            const active = availability === value;
            const label = value
              ? t(`dinee.availability_${value}`)
              : t("dinee.allAvailability");
            return (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => onChange("availability", value)}
                className={`min-h-9 shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30" : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:bg-white/3 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
