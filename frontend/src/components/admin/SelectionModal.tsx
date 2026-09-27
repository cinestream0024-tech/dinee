import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminModal from "@/components/admin/AdminModal";
import {
  EmptyState,
  ErrorState,
  LoadingTable,
  MutationError,
} from "@/components/admin/AsyncState";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import { controlClass } from "@/components/admin/formStyles";
import Badge from "@/components/ui/badge/Badge";
import { eventKeys } from "@/features/events/api";
import { listProfiles, profileKeys } from "@/features/profiles/api";
import {
  listSelections,
  selectProfile,
  selectionKeys,
  withdrawSelection,
} from "@/features/selections/api";
import { PlusIcon, SearchIcon, TrashBinIcon } from "@/icons";
import type { DineeEvent, Profile } from "@/types/dinee";

function isSelectable(event: DineeEvent | null) {
  return Boolean(
    event &&
    (event.status === "draft" || event.status === "upcoming") &&
    event.starts_at &&
    new Date(event.starts_at).getTime() > Date.now(),
  );
}

export default function SelectionModal({
  event,
  onClose,
  onUpdated,
}: {
  event: DineeEvent | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const eventId = event?.id ?? 0;
  const selectable = isSelectable(event);

  const selections = useQuery({
    queryKey: selectionKeys.event(eventId),
    queryFn: () => listSelections(eventId),
    enabled: Boolean(event),
  });
  const profiles = useQuery({
    queryKey: profileKeys.list({ q: search, page: 1, perPage: 20 }),
    queryFn: () => listProfiles({ q: search, page: 1, perPage: 20 }),
    enabled: Boolean(event),
  });

  const selectedIds = useMemo(
    () => new Set(selections.data?.data.map((item) => item.profile.id) ?? []),
    [selections.data],
  );
  const availableProfiles =
    profiles.data?.data.filter((profile) => !selectedIds.has(profile.id)) ?? [];

  const invalidate = async (profileId?: number) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: selectionKeys.event(eventId) }),
      client.invalidateQueries({ queryKey: eventKeys.all }),
      profileId
        ? client.invalidateQueries({ queryKey: profileKeys.history(profileId) })
        : Promise.resolve(),
    ]);
  };

  const addMutation = useMutation({
    mutationFn: (profile: Profile) => selectProfile(eventId, profile.id),
    onSuccess: async (_, profile) => {
      await invalidate(profile.id);
      onUpdated(t("dinee.selectionAdded"));
    },
  });
  const removeMutation = useMutation({
    mutationFn: (profile: Profile) => withdrawSelection(eventId, profile.id),
    onSuccess: async (_, profile) => {
      await invalidate(profile.id);
      onUpdated(t("dinee.selectionRemoved"));
    },
  });

  const remove = (profile: Profile) => {
    if (
      window.confirm(
        t("dinee.confirmRemoveSelection", {
          name: `${profile.first_name} ${profile.last_name}`,
        }),
      )
    ) {
      removeMutation.mutate(profile);
    }
  };

  const error = addMutation.error ?? removeMutation.error;

  return (
    <AdminModal
      isOpen={Boolean(event)}
      onClose={onClose}
      busy={addMutation.isPending || removeMutation.isPending}
      title={t("dinee.selectionTitle", { event: event?.title ?? "" })}
      description={t("dinee.selectionDescription")}
      width="max-w-4xl"
    >
      <div className="grid min-h-96 grid-cols-1 lg:grid-cols-2">
        <section className="border-b border-gray-100 p-5 sm:p-6 lg:border-e lg:border-b-0 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              {t("dinee.selectedPeople")}
            </h3>
            <Badge color="light">{selections.data?.meta.total ?? 0}</Badge>
          </div>

          {error && (
            <div className="mt-4">
              <MutationError message={t(apiErrorMessageKey(error))} />
            </div>
          )}
          {!selectable && (
            <div className="mt-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-warning-300">
              {t("dinee.eventNotSelectable")}
            </div>
          )}

          {selections.isPending ? (
            <LoadingTable rows={3} />
          ) : selections.isError ? (
            <ErrorState onRetry={() => selections.refetch()} />
          ) : selections.data.data.length === 0 ? (
            <EmptyState
              title={t("dinee.noSelections")}
              description={t("dinee.noSelectionsDescription")}
            />
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {selections.data.data.map(({ id, profile }) => (
                <li
                  key={id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                      {[profile.job_title, profile.company]
                        .filter(Boolean)
                        .join(" · ") || t("dinee.noProfessionalDetails")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!selectable || removeMutation.isPending}
                    onClick={() => remove(profile)}
                    aria-label={t("dinee.removeNamedSelection", {
                      name: `${profile.first_name} ${profile.last_name}`,
                    })}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-5 sm:p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">
            {t("dinee.addPerson")}
          </h3>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              setSearch(draftSearch.trim());
            }}
          >
            <label className="sr-only" htmlFor="selection-search">
              {t("dinee.findPerson")}
            </label>
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                id="selection-search"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder={t("dinee.findPerson")}
                className={`${controlClass()} ps-10`}
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {t("dinee.search")}
            </button>
          </form>

          {profiles.isPending ? (
            <LoadingTable rows={4} />
          ) : profiles.isError ? (
            <ErrorState onRetry={() => profiles.refetch()} />
          ) : availableProfiles.length === 0 ? (
            <EmptyState
              title={t("dinee.noAvailableProfiles")}
              description={t("dinee.noAvailableProfilesDescription")}
            />
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {availableProfiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                      {[profile.job_title, profile.company]
                        .filter(Boolean)
                        .join(" · ") || t("dinee.noProfessionalDetails")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!selectable || addMutation.isPending}
                    onClick={() => addMutation.mutate(profile)}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                  >
                    <PlusIcon className="size-4" />
                    {t("dinee.add")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminModal>
  );
}
