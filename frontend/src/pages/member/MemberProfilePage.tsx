import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import MemberProfileHeader from "@/components/member/MemberProfileHeader";
import MemberAvailabilityCard from "@/components/member/MemberAvailabilityCard";
import MemberProfileSection from "@/components/member/MemberProfileSection";
import PageMeta from "@/components/common/PageMeta";
import { getMemberProfile, memberProfileKey } from "@/features/profiles/api";
import {
  DineeAlertIcon,
  DineeMailIcon,
  DineePhoneIcon,
  GlobeIcon,
} from "@/icons";
import { ApiError } from "@/services/api";

function ProfileValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <dt className="text-theme-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-6 whitespace-pre-line text-gray-700 dark:text-gray-300">
        {value || t("dinee.notProvided")}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t("dinee.loading")}
      className="animate-pulse"
    >
      <div className="h-56 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="h-72 rounded-2xl bg-gray-100 md:col-span-2 dark:bg-gray-800" />
        <div className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function MemberProfilePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const profileUpdated = Boolean(
    (location.state as { profileUpdated?: boolean } | null)?.profileUpdated,
  );
  const profileQuery = useQuery({
    queryKey: memberProfileKey,
    queryFn: getMemberProfile,
  });
  const unavailable =
    profileQuery.error instanceof ApiError && profileQuery.error.status === 404;

  return (
    <>
      <PageMeta
        title={`${t("dinee.myProfile")} | ${t("dinee.brand")}`}
        description={t("dinee.memberProfileSubtitle")}
      />

      {profileUpdated && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-300"
        >
          {t("dinee.memberProfileSaved")}
        </div>
      )}

      {profileQuery.isPending && <ProfileSkeleton />}

      {profileQuery.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <DineeAlertIcon aria-hidden="true" className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t(unavailable ? "dinee.profileUnavailable" : "dinee.loadFailed")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t(
              unavailable
                ? "dinee.profileUnavailableDescription"
                : "dinee.networkError",
            )}
          </p>
          {!unavailable && (
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="mt-5 min-h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              {t("dinee.retry")}
            </button>
          )}
        </div>
      )}

      {profileQuery.data && (
        <div className="space-y-5">
          <MemberProfileHeader profile={profileQuery.data} />

          <MemberAvailabilityCard profile={profileQuery.data} />

          <div className="grid gap-5 md:grid-cols-3 md:items-start">
            <div className="space-y-5 md:col-span-2">
              <MemberProfileSection title={t("dinee.aboutMe")}>
                <p className="text-sm leading-6 whitespace-pre-line text-gray-700 dark:text-gray-300">
                  {profileQuery.data.bio || t("dinee.notProvided")}
                </p>
                <dl className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
                  <ProfileValue
                    label={t("dinee.myInterests")}
                    value={profileQuery.data.interests}
                  />
                </dl>
              </MemberProfileSection>

              <MemberProfileSection title={t("dinee.professionalIntentions")}>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <ProfileValue
                    label={t("dinee.whatILookFor")}
                    value={profileQuery.data.looking_for}
                  />
                  <ProfileValue
                    label={t("dinee.whatIBring")}
                    value={profileQuery.data.contributions}
                  />
                </dl>
              </MemberProfileSection>
            </div>

            <MemberProfileSection title={t("dinee.contactDetails")}>
              <p className="mb-4 text-theme-xs leading-5 text-gray-500 dark:text-gray-400">
                {t("dinee.privateContactNotice")}
              </p>
              <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                {profileQuery.data.email && (
                  <li className="flex items-start gap-3">
                    <DineeMailIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-gray-400"
                    />
                    <span className="min-w-0 break-all">
                      {profileQuery.data.email}
                    </span>
                  </li>
                )}
                {profileQuery.data.phone && (
                  <li className="flex items-start gap-3">
                    <DineePhoneIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-gray-400"
                    />
                    <span>{profileQuery.data.phone}</span>
                  </li>
                )}
                {profileQuery.data.linkedin_url && (
                  <li>
                    <a
                      href={profileQuery.data.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center gap-3 rounded-xl text-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      <GlobeIcon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                      />
                      <span>{t("dinee.viewLinkedIn")}</span>
                    </a>
                  </li>
                )}
                {!profileQuery.data.email &&
                  !profileQuery.data.phone &&
                  !profileQuery.data.linkedin_url && (
                    <li className="text-gray-500 dark:text-gray-400">
                      {t("dinee.notProvided")}
                    </li>
                  )}
              </ul>
            </MemberProfileSection>
          </div>
        </div>
      )}
    </>
  );
}
