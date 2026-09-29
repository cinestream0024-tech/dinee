import { useTranslation } from "react-i18next";
import ProfileAvatar from "@/components/profiles/ProfileAvatar";
import { DineeCompanyIcon } from "@/icons";
import type { Profile } from "@/types/dinee";

export default function MemberProfileHeader({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const professionalLine = [profile.job_title, profile.company]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="h-20 bg-brand-50 dark:bg-brand-500/10" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-12">
          <ProfileAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            size="lg"
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-title-sm font-semibold text-gray-950 dark:text-white">
              {profile.first_name} {profile.last_name}
            </h1>
            {professionalLine && (
              <p className="mt-2 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <DineeCompanyIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{professionalLine}</span>
              </p>
            )}
            {profile.sector && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {profile.sector}
              </p>
            )}
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-theme-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t(`dinee.availability_${profile.availability}`)}
          </span>
        </div>
      </div>
    </header>
  );
}
