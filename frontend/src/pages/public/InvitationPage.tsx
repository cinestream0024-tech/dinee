import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { MutationError } from "@/components/admin/AsyncState";
import { apiErrorMessageKey } from "@/components/admin/apiErrors";
import PageMeta from "@/components/common/PageMeta";
import InvitationAccountActivation from "@/components/invitations/InvitationAccountActivation";
import {
  getPublicInvitation,
  invitationKeys,
  respondToInvitation,
} from "@/features/invitations/api";
import {
  DineeCalendarIcon,
  DineeCheckIcon,
  DineeClockIcon,
  DineeCloseIcon,
  DineeMapPinIcon,
} from "@/icons";

export default function InvitationPage() {
  const { t, i18n } = useTranslation();
  const { token = "" } = useParams();
  const client = useQueryClient();
  const [declining, setDeclining] = useState(false);
  const [activatingAccount, setActivatingAccount] = useState(false);
  const query = useQuery({
    queryKey: invitationKeys.public(token),
    queryFn: () => getPublicInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
  const responseMutation = useMutation({
    mutationFn: ({
      response,
      futureInterest,
    }: {
      response: "accepted" | "declined";
      futureInterest?: boolean;
    }) =>
      respondToInvitation(token, {
        response,
        ...(response === "declined" ? { future_interest: futureInterest } : {}),
      }),
    onSuccess: (response) => {
      client.setQueryData(invitationKeys.public(token), response);
      setDeclining(false);
    },
  });

  const invitation = query.data?.data;
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: invitation?.event.timezone,
        }).format(new Date(value))
      : "—";

  return (
    <>
      <PageMeta
        title={`${t("dinee.invitation")} | ${t("dinee.brand")}`}
        description={t("dinee.publicInvitationIntro")}
      />

      {query.isPending ? (
        <div
          role="status"
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="h-7 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-5 h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : query.isError || !invitation ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <DineeCloseIcon className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-title-sm font-semibold text-gray-900 dark:text-white">
            {t("dinee.invalidInvitation")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("dinee.invalidInvitationDescription")}
          </p>
        </div>
      ) : (
        <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <header className="bg-brand-500 px-6 py-7 text-white">
            <p className="text-sm font-medium text-white/75">
              {t("dinee.privateInvitation")}
            </p>
            <h1 className="mt-2 text-title-sm font-semibold">
              {invitation.event.title}
            </h1>
          </header>

          <div className="space-y-6 p-6">
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-start gap-3">
                <DineeCalendarIcon
                  className="mt-0.5 size-5 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <span>{formatDate(invitation.event.starts_at)}</span>
              </p>
              <p className="flex items-start gap-3">
                <DineeMapPinIcon
                  className="mt-0.5 size-5 shrink-0 text-brand-500"
                  aria-hidden="true"
                />
                <span>{invitation.event.location || "—"}</span>
              </p>
            </div>

            {invitation.event.description && (
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                {invitation.event.description}
              </p>
            )}

            {responseMutation.isError && (
              <MutationError
                message={t(apiErrorMessageKey(responseMutation.error))}
              />
            )}

            {invitation.status === "pending" && !declining && (
              <div className="space-y-3">
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {t("dinee.canYouAttend")}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    responseMutation.mutate({ response: "accepted" })
                  }
                  disabled={responseMutation.isPending}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-base font-semibold text-white shadow-theme-sm hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
                >
                  <DineeCheckIcon className="size-5" aria-hidden="true" />
                  {t("dinee.iWillAttend")}
                </button>
                <button
                  type="button"
                  onClick={() => setDeclining(true)}
                  disabled={responseMutation.isPending}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 text-base font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/3"
                >
                  <DineeCloseIcon className="size-5" aria-hidden="true" />
                  {t("dinee.iAmUnavailable")}
                </button>
              </div>
            )}

            {invitation.status === "pending" && declining && (
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/3">
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {t("dinee.futureEditionQuestion")}
                </p>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      responseMutation.mutate({
                        response: "declined",
                        futureInterest: true,
                      })
                    }
                    disabled={responseMutation.isPending}
                    className="min-h-12 rounded-xl bg-brand-500 px-4 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {t("dinee.yesFutureEdition")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      responseMutation.mutate({
                        response: "declined",
                        futureInterest: false,
                      })
                    }
                    disabled={responseMutation.isPending}
                    className="min-h-12 rounded-xl border border-gray-300 px-4 font-medium text-gray-700 hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t("dinee.noFutureEdition")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclining(false)}
                    className="min-h-11 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t("dinee.back")}
                  </button>
                </div>
              </div>
            )}

            {invitation.status === "accepted" && (
              <div
                role="status"
                className="rounded-2xl bg-success-50 p-5 text-center dark:bg-success-500/15"
              >
                <DineeCheckIcon
                  className="mx-auto size-8 text-success-600 dark:text-success-400"
                  aria-hidden="true"
                />
                <h2 className="mt-3 font-semibold text-success-700 dark:text-success-300">
                  {t("dinee.attendanceConfirmed")}
                </h2>
                <p className="mt-1 text-sm text-success-700/80 dark:text-success-300/80">
                  {t("dinee.attendanceConfirmedDescription")}
                </p>
              </div>
            )}

            {invitation.status === "declined" && (
              <div
                role="status"
                className="rounded-2xl bg-gray-50 p-5 text-center dark:bg-white/3"
              >
                <DineeClockIcon
                  className="mx-auto size-8 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                />
                <h2 className="mt-3 font-semibold text-gray-800 dark:text-white/90">
                  {t("dinee.unavailabilityRecorded")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    invitation.future_interest
                      ? "dinee.futureInterestRecorded"
                      : "dinee.responseRecorded",
                  )}
                </p>
              </div>
            )}

            {invitation.status === "cancelled" && (
              <div className="rounded-2xl bg-gray-50 p-5 text-center dark:bg-white/3">
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {t("dinee.invitationCancelled")}
                </p>
              </div>
            )}

            {invitation.status !== "pending" &&
              invitation.can_activate_account &&
              !activatingAccount && (
                <button
                  type="button"
                  onClick={() => setActivatingAccount(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-sm hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {t("dinee.activateMemberSpace")}
                </button>
              )}

            {invitation.status !== "pending" &&
              invitation.can_activate_account &&
              activatingAccount && (
                <InvitationAccountActivation token={token} />
              )}

            {invitation.status !== "pending" && invitation.has_member_account && (
              <Link
                to="/login"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                {t("dinee.memberSpaceLink")}
              </Link>
            )}
          </div>
        </article>
      )}
    </>
  );
}
