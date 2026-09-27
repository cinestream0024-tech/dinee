import { useTranslation } from "react-i18next";
import Badge from "@/components/ui/badge/Badge";
import {
  DineeCalendarIcon,
  DineeEditIcon,
  DineeMapPinIcon,
  DineeUsersIcon,
} from "@/icons";
import type { DineeEvent } from "@/types/dinee";

interface Props {
  event: DineeEvent;
  formattedDate: string;
  onEdit: () => void;
  onSelect: () => void;
}

export default function EventSpotlight({
  event,
  formattedDate,
  onEdit,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const progress = event.capacity
    ? Math.min(100, Math.round((event.selected_count / event.capacity) * 100))
    : 0;

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-theme-sm sm:p-6 dark:border dark:border-gray-800">
      <div className="pointer-events-none absolute -end-16 -top-24 size-64 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-brand-300">
              <DineeCalendarIcon aria-hidden="true" className="size-4" />
            </span>
            <p className="text-theme-xs font-semibold tracking-wider text-brand-300 uppercase">
              {t("dinee.nextEdition")}
            </p>
            <Badge color="success">{t("dinee.status_upcoming")}</Badge>
          </div>
          <h2 className="truncate text-xl font-semibold sm:text-2xl">
            {event.title}
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-300 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-2">
              <DineeCalendarIcon aria-hidden="true" className="size-4" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-2">
              <DineeMapPinIcon aria-hidden="true" className="size-4" />
              {event.location || "—"}
            </span>
          </div>
        </div>
        <div className="w-full lg:max-w-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-gray-300">
              <DineeUsersIcon aria-hidden="true" className="size-4" />
              {t("dinee.selectedCount")}
            </span>
            <strong className="font-semibold">
              {event.selected_count}
              {event.capacity ? ` / ${event.capacity}` : ""}
            </strong>
          </div>
          {event.capacity && (
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-brand-400 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <DineeUsersIcon aria-hidden="true" className="size-4" />
              {t("dinee.selection")}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <DineeEditIcon aria-hidden="true" className="size-4" />
              {t("dinee.edit")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
