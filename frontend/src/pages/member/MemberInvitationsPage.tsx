import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import {
  invitationKeys,
  listMemberInvitations,
  respondToMemberInvitation,
} from "@/features/invitations/api";
import {
  DineeAlertIcon,
  DineeCalendarIcon,
  DineeCheckIcon,
  DineeCloseIcon,
  DineeMapPinIcon,
} from "@/icons";
import type { MemberInvitation } from "@/types/dinee";

function InvitationCard({
  invitation,
  declining,
  busy,
  error,
  onAccept,
  onDecline,
  onCancelDecline,
}: {
  invitation: MemberInvitation;
  declining: boolean;
  busy: boolean;
  error: string | null;
  onAccept: () => void;
  onDecline: (futureInterest?: boolean) => void;
  onCancelDecline: () => void;
}) {
  const { t, i18n } = useTranslation();
  const date = invitation.event.starts_at
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: invitation.event.timezone,
      }).format(new Date(invitation.event.starts_at))
    : t("dinee.unscheduled");

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {invitation.event.title}
          </h3>
          <p className="mt-2 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <DineeCalendarIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{date}</span>
          </p>
          {invitation.event.location && (
            <p className="mt-1.5 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <DineeMapPinIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{invitation.event.location}</span>
            </p>
          )}
        </div>
        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-theme-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {t(`dinee.history_${invitation.status}`)}
        </span>
      </div>

      {invitation.event.description && (
        <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:text-gray-300">
          {invitation.event.description}
        </p>
      )}

      {error && <div className="mt-4"><MutationError message={error} /></div>}

      {invitation.can_respond && !declining && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60 ${
              invitation.status === "accepted"
                ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300"
                : "bg-brand-500 text-white hover:bg-brand-600"
            }`}
          >
            <DineeCheckIcon aria-hidden="true" className="size-5" />
            {t("dinee.iWillAttend")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecline()}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60 ${
              invitation.status === "declined"
                ? "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <DineeCloseIcon aria-hidden="true" className="size-5" />
            {t("dinee.iAmUnavailable")}
          </button>
        </div>
      )}

      {invitation.can_respond && declining && (
        <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {t("dinee.futureEditionQuestion")}
          </p>
          <div className="mt-3 grid gap-2">
            <button type="button" disabled={busy} onClick={() => onDecline(true)} className="min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
              {t("dinee.yesFutureEdition")}
            </button>
            <button type="button" disabled={busy} onClick={() => onDecline(false)} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              {t("dinee.noFutureEdition")}
            </button>
            <button type="button" onClick={onCancelDecline} className="min-h-11 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              {t("dinee.back")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function MemberInvitationsPage() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const query = useQuery({
    queryKey: invitationKeys.member(),
    queryFn: listMemberInvitations,
  });
  const mutation = useMutation({
    mutationFn: ({ id, response, futureInterest }: { id: number; response: "accepted" | "declined"; futureInterest?: boolean }) =>
      respondToMemberInvitation(id, {
        response,
        ...(response === "declined" ? { future_interest: futureInterest } : {}),
      }),
    onSuccess: ({ data }) => {
      client.setQueryData<MemberInvitation[]>(invitationKeys.member(), (current = []) =>
        current.map((invitation) => invitation.id === data.id ? data : invitation),
      );
      setDecliningId(null);
    },
  });

  const referenceTime = query.dataUpdatedAt;
  const current = (query.data ?? []).filter((invitation) =>
    invitation.event.starts_at
      ? new Date(invitation.event.starts_at).getTime() >= referenceTime
      : invitation.can_respond,
  );
  const past = (query.data ?? []).filter(
    (invitation) => !current.some((item) => item.id === invitation.id),
  );

  const section = (title: string, invitations: MemberInvitation[]) =>
    invitations.length > 0 && (
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <div className="mt-4 space-y-4">
          {invitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              declining={decliningId === invitation.id}
              busy={mutation.isPending && mutation.variables?.id === invitation.id}
              error={mutation.isError && mutation.variables?.id === invitation.id ? t(apiErrorMessageKey(mutation.error)) : null}
              onAccept={() => mutation.mutate({ id: invitation.id, response: "accepted" })}
              onDecline={(futureInterest) => {
                if (futureInterest === undefined) setDecliningId(invitation.id);
                else mutation.mutate({ id: invitation.id, response: "declined", futureInterest });
              }}
              onCancelDecline={() => setDecliningId(null)}
            />
          ))}
        </div>
      </section>
    );

  return (
    <>
      <PageMeta title={`${t("dinee.myInvitations")} | ${t("dinee.brand")}`} description={t("dinee.memberInvitationsSubtitle")} />
      <header className="mb-8">
        <p className="text-sm font-medium tracking-widest text-brand-600 uppercase dark:text-brand-400">{t("dinee.myInvitations")}</p>
        <h1 className="mt-3 text-title-sm font-semibold text-gray-950 sm:text-title-md dark:text-white">{t("dinee.memberInvitationsTitle")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300">{t("dinee.memberInvitationsSubtitle")}</p>
      </header>

      {query.isPending && <div role="status" aria-label={t("dinee.loading")} className="space-y-4 animate-pulse"><div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" /><div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" /></div>}
      {query.isError && <div role="alert" className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"><DineeAlertIcon aria-hidden="true" className="mx-auto size-7 text-error-500" /><h2 className="mt-4 font-semibold text-gray-900 dark:text-white">{t("dinee.memberInvitationsError")}</h2><button type="button" onClick={() => query.refetch()} className="mt-5 min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white">{t("dinee.retry")}</button></div>}
      {query.data?.length === 0 && <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"><DineeCalendarIcon aria-hidden="true" className="mx-auto size-7 text-brand-500" /><h2 className="mt-4 font-semibold text-gray-900 dark:text-white">{t("dinee.memberInvitationsEmpty")}</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("dinee.memberInvitationsEmptyDescription")}</p></div>}
      {query.data && query.data.length > 0 && <div className="space-y-10">{section(t("dinee.upcomingHistory"), current)}{section(t("dinee.pastHistory"), past)}</div>}
    </>
  );
}
