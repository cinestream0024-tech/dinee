import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import MemberProfileForm from "@/components/member/MemberProfileForm";
import PageMeta from "@/components/common/PageMeta";
import { getMemberProfile, memberProfileKey } from "@/features/profiles/api";
import { DineeAlertIcon, DineeChevronLeftIcon } from "@/icons";
import { ApiError } from "@/services/api";

export default function MemberProfileEditPage() {
  const { t } = useTranslation();
  const profileQuery = useQuery({
    queryKey: memberProfileKey,
    queryFn: getMemberProfile,
  });
  const unavailable =
    profileQuery.error instanceof ApiError && profileQuery.error.status === 404;

  return (
    <>
      <PageMeta
        title={`${t("dinee.editProfile")} | ${t("dinee.brand")}`}
        description={t("dinee.memberProfileEditSubtitle")}
      />

      <div className="mb-6">
        <Link
          to="/member/profile"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:text-white"
        >
          <DineeChevronLeftIcon
            aria-hidden="true"
            className="size-4 rtl:rotate-180"
          />
          {t("dinee.backToProfile")}
        </Link>
        <h1 className="mt-3 text-title-sm font-semibold text-gray-950 dark:text-white">
          {t("dinee.editProfile")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          {t("dinee.memberProfileEditSubtitle")}
        </p>
      </div>

      {profileQuery.isPending && (
        <div
          role="status"
          aria-label={t("dinee.loading")}
          className="animate-pulse space-y-5"
        >
          <div className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-56 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      {profileQuery.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <DineeAlertIcon aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t(unavailable ? "dinee.profileUnavailable" : "dinee.loadFailed")}
          </h2>
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

      {profileQuery.data && <MemberProfileForm profile={profileQuery.data} />}
    </>
  );
}
