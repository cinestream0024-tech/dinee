import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  EmptyState,
  ErrorState,
  LoadingTable,
  MutationError,
} from "@/components/admin/AsyncState";
import Pagination from "@/components/admin/Pagination";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import InvitationDeliveryModal from "@/components/invitations/InvitationDeliveryModal";
import InvitationQueue from "@/components/invitations/InvitationQueue";
import InvitationStatusBadge from "@/components/invitations/InvitationStatusBadge";
import ProfileAvatar from "@/components/profiles/ProfileAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { useModal } from "@/hooks/useModal";
import { eventKeys, listEvents } from "@/features/events/api";
import {
  createInvitation,
  invitationKeys,
  listInvitations,
  markInvitationSent,
  rotateInvitationToken,
} from "@/features/invitations/api";
import { listSelections, selectionKeys } from "@/features/selections/api";
import { DineeMailIcon, DineePhoneIcon, DineeSendIcon } from "@/icons";
import type {
  EventSelection,
  InvitationDelivery,
  InvitationMutationResult,
} from "@/types/dinee";

type PreparedInvitation = InvitationDelivery & { invitationId: number };

function hasDelivery(
  invitation: InvitationMutationResult,
): invitation is InvitationMutationResult & InvitationDelivery {
  return Boolean(
    invitation.public_token &&
    invitation.public_url &&
    invitation.whatsapp_message &&
    invitation.whatsapp_url,
  );
}

export default function InvitationsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const client = useQueryClient();
  const deliveryModal = useModal();
  const [delivery, setDelivery] = useState<PreparedInvitation | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const requestedEventId = Number(params.get("event") ?? 0);
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const eventsQuery = useQuery({
    queryKey: eventKeys.list({ page: 1, perPage: 100 }),
    queryFn: () => listEvents({ page: 1, perPage: 100 }),
  });
  const events = eventsQuery.data?.data ?? [];
  const fallbackEvent =
    events.find((event) => event.status === "upcoming") ?? events[0];
  const selectedEvent =
    events.find((event) => event.id === requestedEventId) ?? fallbackEvent;
  const eventId = selectedEvent?.id;

  const invitationsQuery = useQuery({
    queryKey: invitationKeys.list(eventId ?? 0, { page, perPage: 20 }),
    queryFn: () => listInvitations(eventId!, { page, perPage: 20 }),
    enabled: Boolean(eventId),
  });
  const coverageQuery = useQuery({
    queryKey: invitationKeys.list(eventId ?? 0, { page: 1, perPage: 100 }),
    queryFn: () => listInvitations(eventId!, { page: 1, perPage: 100 }),
    enabled: Boolean(eventId),
  });
  const selectionsQuery = useQuery({
    queryKey: selectionKeys.event(eventId ?? 0),
    queryFn: () => listSelections(eventId!),
    enabled: Boolean(eventId),
  });
  const invitedSelectionIds = useMemo(
    () => new Set(coverageQuery.data?.data.map((item) => item.selection.id)),
    [coverageQuery.data],
  );
  const selectionsToInvite = useMemo(
    () =>
      selectionsQuery.data?.data.filter(
        (selection) => !invitedSelectionIds.has(selection.id),
      ) ?? [],
    [invitedSelectionIds, selectionsQuery.data],
  );

  const refreshInvitations = async () => {
    if (!eventId) return;
    await client.invalidateQueries({ queryKey: invitationKeys.admin(eventId) });
  };
  const showDelivery = (invitation: InvitationMutationResult) => {
    if (!hasDelivery(invitation)) {
      setActionError(t("dinee.unexpectedError"));
      return;
    }
    setActionError(null);
    setDelivery({
      invitationId: invitation.id,
      public_token: invitation.public_token,
      public_url: invitation.public_url,
      whatsapp_message: invitation.whatsapp_message,
      whatsapp_url: invitation.whatsapp_url,
    });
    deliveryModal.openModal();
  };
  const createMutation = useMutation({
    mutationFn: (selection: EventSelection) =>
      createInvitation(eventId!, selection.id),
    onSuccess: async (response) => {
      showDelivery(response.data);
      setNotice(t("dinee.invitationCreated"));
      await refreshInvitations();
    },
    onError: (error) => setActionError(t(apiErrorMessageKey(error))),
  });
  const prepareMutation = useMutation({
    mutationFn: (invitationId: number) => rotateInvitationToken(invitationId),
    onSuccess: (response) => showDelivery(response.data),
    onError: (error) => setActionError(t(apiErrorMessageKey(error))),
  });
  const markSentMutation = useMutation({
    mutationFn: () => markInvitationSent(delivery!.invitationId),
    onSuccess: async () => {
      await refreshInvitations();
      setNotice(t("dinee.invitationMarkedSent"));
      deliveryModal.closeModal();
      setDelivery(null);
    },
  });

  const canInvite = selectedEvent?.status === "upcoming";

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  const selectEvent = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("event", value);
    next.delete("page");
    setParams(next);
  };
  const selectPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    if (eventId) next.set("event", String(eventId));
    setParams(next);
  };

  return (
    <>
      <PageMeta
        title={`${t("dinee.invitationsTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.invitationsSubtitle")}
      />
      <PageBreadCrumb pageTitle={t("dinee.invitationsTitle")} />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {t("dinee.invitationsSubtitle")}
          </p>
          {selectedEvent && (
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDate(selectedEvent.starts_at)}
              {selectedEvent.location ? ` · ${selectedEvent.location}` : ""}
            </p>
          )}
        </div>
        <label className="w-full lg:max-w-xs">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.chooseEvent")}
          </span>
          <select
            value={eventId ?? ""}
            onChange={(event) => selectEvent(event.target.value)}
            disabled={eventsQuery.isPending || events.length === 0}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
          >
            {events.length === 0 && <option value="">—</option>}
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300"
        >
          {notice}
        </div>
      )}
      {actionError && (
        <div className="mb-4">
          <MutationError message={actionError} />
        </div>
      )}

      <InvitationQueue
        selections={canInvite ? selectionsToInvite : []}
        busySelectionId={
          createMutation.isPending
            ? (createMutation.variables?.id ?? null)
            : null
        }
        onCreate={(selection) => {
          setNotice("");
          setActionError(null);
          createMutation.mutate(selection);
        }}
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
        {eventsQuery.isPending ? (
          <LoadingTable />
        ) : eventsQuery.isError ? (
          <ErrorState onRetry={() => eventsQuery.refetch()} />
        ) : !selectedEvent ? (
          <EmptyState
            title={t("dinee.noAvailableEvent")}
            description={t("dinee.noAvailableEventDescription")}
          />
        ) : invitationsQuery.isPending ? (
          <LoadingTable />
        ) : invitationsQuery.isError ? (
          <ErrorState onRetry={() => invitationsQuery.refetch()} />
        ) : invitationsQuery.data.data.length === 0 ? (
          <EmptyState
            title={t("dinee.noInvitations")}
            description={t("dinee.noInvitationsDescription")}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 sm:hidden dark:divide-gray-800">
              {invitationsQuery.data.data.map((invitation) => (
                <article key={invitation.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <ProfileAvatar
                      firstName={invitation.selection.profile.first_name}
                      lastName={invitation.selection.profile.last_name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-gray-800 dark:text-white/90">
                            {invitation.selection.profile.first_name}{" "}
                            {invitation.selection.profile.last_name}
                          </h2>
                          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {invitation.selection.profile.job_title || "—"}
                            {invitation.selection.profile.company
                              ? ` · ${invitation.selection.profile.company}`
                              : ""}
                          </p>
                        </div>
                        <InvitationStatusBadge status={invitation.status} />
                      </div>
                      <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
                        {invitation.sent_at
                          ? t("dinee.sentOn", {
                              date: formatDate(invitation.sent_at),
                            })
                          : t("dinee.notSent")}
                      </p>
                      {invitation.status === "pending" &&
                        !invitation.sent_at && (
                          <button
                            type="button"
                            onClick={() =>
                              prepareMutation.mutate(invitation.id)
                            }
                            disabled={prepareMutation.isPending}
                            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                          >
                            <DineeSendIcon
                              className="size-4"
                              aria-hidden="true"
                            />
                            {t("dinee.prepareWhatsApp")}
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full">
                <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
                  <tr>
                    {["person", "contact", "status", "sending", "actions"].map(
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
                  {invitationsQuery.data.data.map((invitation) => {
                    const profile = invitation.selection.profile;
                    return (
                      <tr
                        key={invitation.id}
                        className="hover:bg-gray-50/70 dark:hover:bg-white/2"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              firstName={profile.first_name}
                              lastName={profile.last_name}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white/90">
                                {profile.first_name} {profile.last_name}
                              </p>
                              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                                {profile.job_title || "—"}
                                {profile.company ? ` · ${profile.company}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                            {profile.phone && (
                              <a
                                href={`tel:${profile.phone}`}
                                className="flex items-center gap-2 hover:text-brand-600"
                              >
                                <DineePhoneIcon className="size-4" />
                                {profile.phone}
                              </a>
                            )}
                            {profile.email && (
                              <a
                                href={`mailto:${profile.email}`}
                                className="flex items-center gap-2 hover:text-brand-600"
                              >
                                <DineeMailIcon className="size-4" />
                                {profile.email}
                              </a>
                            )}
                            {!profile.phone && !profile.email && "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <InvitationStatusBadge status={invitation.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {invitation.sent_at
                            ? formatDate(invitation.sent_at)
                            : t("dinee.notSent")}
                        </td>
                        <td className="px-5 py-4">
                          {invitation.status === "pending" &&
                            !invitation.sent_at && (
                              <button
                                type="button"
                                onClick={() =>
                                  prepareMutation.mutate(invitation.id)
                                }
                                disabled={prepareMutation.isPending}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                              >
                                <DineeSendIcon
                                  className="size-4"
                                  aria-hidden="true"
                                />
                                {t("dinee.prepareWhatsApp")}
                              </button>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              meta={invitationsQuery.data.meta}
              onPageChange={selectPage}
            />
          </>
        )}
      </section>
      <InvitationDeliveryModal
        isOpen={deliveryModal.isOpen}
        delivery={delivery}
        isMarkingSent={markSentMutation.isPending}
        errorMessage={
          markSentMutation.isError
            ? t(apiErrorMessageKey(markSentMutation.error))
            : null
        }
        onClose={() => {
          deliveryModal.closeModal();
          setDelivery(null);
        }}
        onMarkSent={() => markSentMutation.mutate()}
      />
    </>
  );
}
