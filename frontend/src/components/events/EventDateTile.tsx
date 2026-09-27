import { DineeCalendarIcon } from "@/icons";

interface EventDateTileProps {
  value: string | null;
  locale: string;
  unscheduledLabel: string;
}

export default function EventDateTile({
  value,
  locale,
  unscheduledLabel,
}: EventDateTileProps) {
  if (!value) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900">
        <DineeCalendarIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">{unscheduledLabel}</span>
      </div>
    );
  }

  const date = new Date(value);
  const month = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .replace(".", "");
  const day = new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(date);

  return (
    <time
      dateTime={value}
      className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
    >
      <span className="text-theme-xs font-semibold uppercase">{month}</span>
      <span className="text-xl leading-none font-bold">{day}</span>
    </time>
  );
}
