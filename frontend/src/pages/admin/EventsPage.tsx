import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  EmptyState,
  ErrorState,
  LoadingTable,
} from "@/components/admin/AsyncState";
import EventFormModal from "@/components/admin/EventFormModal";
import Pagination from "@/components/admin/Pagination";
import SelectionModal from "@/components/admin/SelectionModal";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import EventDateTile from "@/components/events/EventDateTile";
import EventFilters from "@/components/events/EventFilters";
import EventSpotlight from "@/components/events/EventSpotlight";
import Badge from "@/components/ui/badge/Badge";
import { useLanguage } from "@/context/LanguageContext";
import { eventKeys, listEvents } from "@/features/events/api";
import {
  DineeEditIcon,
  DineeMapPinIcon,
  DineePlusIcon,
  DineeUsersIcon,
} from "@/icons";
import type { DineeEvent, EventPeriod, EventStatus } from "@/types/dinee";

const statusColor: Record<EventStatus, "light" | "info" | "success" | "error"> =
  {
    draft: "light",
    upcoming: "info",
    completed: "success",
    cancelled: "error",
  };

export default function EventsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DineeEvent | null>(null);
  const [selectionEvent, setSelectionEvent] = useState<DineeEvent | null>(null);
  const [notice, setNotice] = useState("");

  const filters = {
    q: params.get("q") ?? "",
    status: (params.get("status") ?? "") as EventStatus | "",
    period: (params.get("period") ?? "") as EventPeriod | "",
    page: Math.max(1, Number(params.get("page") ?? 1)),
    perPage: 20,
  };
  const query = useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => listEvents(filters),
  });
  const nextQuery = useQuery({
    queryKey: eventKeys.list({
      status: "upcoming",
      period: "future",
      page: 1,
      perPage: 1,
    }),
    queryFn: () =>
      listEvents({ status: "upcoming", period: "future", page: 1, perPage: 1 }),
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  const openCreate = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };
  const openEdit = (event: DineeEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  };
  const saved = async (event: DineeEvent) => {
    setFormOpen(false);
    setEditingEvent(null);
    setNotice(t("dinee.eventSaved", { title: event.title }));
    await client.invalidateQueries({ queryKey: eventKeys.all });
  };
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : t("dinee.unscheduled");
  const hasFilters = Boolean(filters.q || filters.status || filters.period);
  const nextEvent = nextQuery.data?.data[0];

  return (
    <>
      <PageMeta
        title={`${t("dinee.eventsTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.eventsSubtitle")}
      />
      <PageBreadCrumb pageTitle={t("dinee.eventsTitle")} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          {t("dinee.eventsSubtitle")}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <DineePlusIcon aria-hidden="true" className="size-5" />
          {t("dinee.newEvent")}
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300"
        >
          {notice}
        </div>
      )}

      {nextEvent && (
        <EventSpotlight
          event={nextEvent}
          formattedDate={formatDate(nextEvent.starts_at)}
          onEdit={() => openEdit(nextEvent)}
          onSelect={() => setSelectionEvent(nextEvent)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
        <EventFilters
          q={filters.q}
          status={filters.status}
          period={filters.period}
          hasFilters={hasFilters}
          onChange={updateParam}
          onReset={() => setParams({})}
        />

        {query.isPending ? (
          <LoadingTable />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data.data.length === 0 ? (
          <EmptyState
            title={t("dinee.noEvents")}
            description={t(
              hasFilters
                ? "dinee.noFilteredEventsDescription"
                : "dinee.noEventsDescription",
            )}
            action={
              !hasFilters ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <DineePlusIcon aria-hidden="true" className="size-4" />
                  {t("dinee.newEvent")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 sm:hidden dark:divide-gray-800">
              {query.data.data.map((event) => (
                <article key={event.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <EventDateTile
                      value={event.starts_at}
                      locale={language}
                      unscheduledLabel={t("dinee.unscheduled")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-gray-800 dark:text-white/90">
                          {event.title}
                        </h2>
                        <Badge color={statusColor[event.status]} size="sm">
                          {t(`dinee.status_${event.status}`)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(event.starts_at)}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <DineeMapPinIcon
                          aria-hidden="true"
                          className="size-4"
                        />
                        {event.location || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t("dinee.selectedCount")}
                    </span>
                    <strong className="text-gray-800 dark:text-white/90">
                      {event.selected_count}
                      {event.capacity ? ` / ${event.capacity}` : ""}
                    </strong>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectionEvent(event)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                    >
                      <DineeUsersIcon aria-hidden="true" className="size-4" />
                      {t("dinee.selection")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      disabled={
                        event.status === "completed" ||
                        event.status === "cancelled"
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                    >
                      <DineeEditIcon aria-hidden="true" className="size-4" />
                      {t("dinee.edit")}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
                  <tr>
                    {["edition", "status", "selectedCount", "actions"].map(
                      (key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                        >
                          {t(`dinee.${key}`)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {query.data.data.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/2"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <EventDateTile
                            value={event.starts_at}
                            locale={language}
                            unscheduledLabel={t("dinee.unscheduled")}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-white/90">
                              {event.title}
                            </p>
                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.starts_at)}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1 text-theme-xs text-gray-400 dark:text-gray-500">
                              <DineeMapPinIcon
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {event.location || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge color={statusColor[event.status]}>
                          {t(`dinee.status_${event.status}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-28">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {event.selected_count}
                            {event.capacity ? ` / ${event.capacity}` : ""}
                          </p>
                          {event.capacity && (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className={`h-full rounded-full ${event.over_capacity ? "bg-error-500" : "bg-brand-500"}`}
                                style={{
                                  width: `${Math.min(100, (event.selected_count / event.capacity) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectionEvent(event)}
                            aria-label={t("dinee.manageSelectionNamed", {
                              title: event.title,
                            })}
                            title={t("dinee.selection")}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          >
                            <DineeUsersIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(event)}
                            disabled={
                              event.status === "completed" ||
                              event.status === "cancelled"
                            }
                            aria-label={t("dinee.editNamedEvent", {
                              title: event.title,
                            })}
                            title={t("dinee.edit")}
                            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          >
                            <DineeEditIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              meta={query.data.meta}
              onPageChange={(page) => updateParam("page", String(page))}
            />
          </>
        )}
      </section>

      {formOpen && (
        <EventFormModal
          isOpen
          event={editingEvent}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}
      {selectionEvent && (
        <SelectionModal
          event={selectionEvent}
          onClose={() => setSelectionEvent(null)}
          onUpdated={setNotice}
        />
      )}
    </>
  );
}
