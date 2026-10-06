import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  DineeArrowRightIcon,
  DineeCalendarIcon,
  DineeMapPinIcon,
} from "@/icons";
import type { MemberInvitation } from "@/types/dinee";

export default function MemberHomeInvitation({
  invitation,
}: {
  invitation?: MemberInvitation;
}) {
  const { t, i18n } = useTranslation();

  if (!invitation) {
    return (
      <section className="rounded-3xl bg-white px-5 py-6 shadow-theme-xs dark:bg-white/[0.04]">
        <p className="text-lg font-semibold text-gray-950 dark:text-white">
          {t("dinee.memberHomeNoInvitation")}
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {t("dinee.memberHomeNoInvitationDescription")}
        </p>
      </section>
    );
  }

  const date = invitation.event.starts_at
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: invitation.event.timezone,
      }).format(new Date(invitation.event.starts_at))
    : t("dinee.unscheduled");

  return (
    <section className="rounded-3xl bg-gray-950 px-5 py-6 text-white shadow-theme-lg dark:bg-white dark:text-gray-950 sm:px-7 sm:py-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-white/65 dark:text-gray-500">
          {t("dinee.memberHomeCurrentInvitation")}
        </p>
        <span className="rounded-full bg-white/10 px-3 py-1 text-theme-xs font-semibold dark:bg-gray-100">
          {t(`dinee.history_${invitation.status}`)}
        </span>
      </div>
      <h2 className="mt-6 text-title-sm font-semibold tracking-tight sm:text-title-md">
        {invitation.event.title}
      </h2>
      <div className="mt-5 space-y-2 text-sm text-white/70 dark:text-gray-600">
        <p className="flex items-start gap-2.5">
          <DineeCalendarIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{date}</span>
        </p>
        {invitation.event.location && (
          <p className="flex items-start gap-2.5">
            <DineeMapPinIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{invitation.event.location}</span>
          </p>
        )}
      </div>
      <Link
        to="/member/invitations"
        className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-gray-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 motion-reduce:transform-none dark:bg-gray-950 dark:text-white"
      >
        {invitation.can_respond
          ? t("dinee.memberHomeRespond")
          : t("dinee.memberHomeViewInvitation")}
        <DineeArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      </Link>
    </section>
  );
}
