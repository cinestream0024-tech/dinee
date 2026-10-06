import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
import MemberHomeActivity from "@/components/member/home/MemberHomeActivity";
import MemberHomeInvitation from "@/components/member/home/MemberHomeInvitation";
import { useSession } from "@/features/auth/auth";
import {
  invitationKeys,
  listMemberInvitations,
} from "@/features/invitations/api";
import {
  getMemberHistory,
  getMemberProfile,
  memberHistoryKey,
  memberProfileKey,
} from "@/features/profiles/api";
import { DineeAddUserIcon, DineeArrowRightIcon } from "@/icons";

export default function MemberHomePage() {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const invitations = useQuery({
    queryKey: invitationKeys.member(),
    queryFn: listMemberInvitations,
  });
  const profile = useQuery({
    queryKey: memberProfileKey,
    queryFn: getMemberProfile,
  });
  const history = useQuery({
    queryKey: memberHistoryKey,
    queryFn: getMemberHistory,
  });
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const referenceTime = invitations.dataUpdatedAt;
  const currentInvitation = [...(invitations.data ?? [])]
    .filter(
      (invitation) =>
        invitation.can_respond ||
        (invitation.event.status === "upcoming" &&
          (!invitation.event.starts_at ||
            new Date(invitation.event.starts_at).getTime() >= referenceTime)),
    )
    .sort((first, second) => {
      if (first.can_respond !== second.can_respond)
        return first.can_respond ? -1 : 1;
      return (
        new Date(first.event.starts_at ?? "9999-12-31").getTime() -
        new Date(second.event.starts_at ?? "9999-12-31").getTime()
      );
    })[0];
  const recentHistory = [...(history.data ?? [])].sort(
    (first, second) =>
      new Date(second.starts_at ?? second.selected_at).getTime() -
      new Date(first.starts_at ?? first.selected_at).getTime(),
  );

  return (
    <>
      <PageMeta
        title={`${t("dinee.memberHome")} | ${t("dinee.brand")}`}
        description={t("dinee.memberHomeSubtitle")}
      />

      <header className="mb-8 sm:mb-10">
        <h1 className="text-title-sm font-semibold tracking-tight text-gray-950 sm:text-title-md dark:text-white">
          {t("dinee.memberHomeGreeting", { name: firstName })}
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base dark:text-gray-400">
          {t("dinee.memberHomeSubtitle")}
        </p>
      </header>

      {invitations.isPending ? (
        <div role="status" aria-label={t("dinee.loading")} className="h-72 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
      ) : (
        <MemberHomeInvitation invitation={currentInvitation} />
      )}

      <section className="mt-8 flex items-center justify-between gap-4 py-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-950 dark:text-white">
            {t("dinee.myAvailability")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {profile.data
              ? t(`dinee.availability_${profile.data.availability}`)
              : t("dinee.loading")}
          </p>
        </div>
        <Link
          to="/member/profile"
          aria-label={t("dinee.memberHomeManageAvailability")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <DineeArrowRightIcon aria-hidden="true" className="size-5 rtl:rotate-180" />
        </Link>
      </section>

      <Link
        to="/member/recommendations"
        className="mt-6 flex min-h-16 items-center gap-4 rounded-2xl bg-brand-50 px-4 text-brand-800 transition-colors hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/15"
      >
        <DineeAddUserIcon aria-hidden="true" className="size-6 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("dinee.recommendSomeone")}</span>
          <span className="mt-0.5 block text-sm font-normal opacity-75">{t("dinee.recommendationHomeDescription")}</span>
        </span>
        <DineeArrowRightIcon aria-hidden="true" className="size-5 shrink-0 rtl:rotate-180" />
      </Link>

      <div className="mt-8">
        <MemberHomeActivity entries={recentHistory} />
      </div>
    </>
  );
}
