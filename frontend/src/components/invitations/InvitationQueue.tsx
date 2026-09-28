import ProfileAvatar from "@/components/profiles/ProfileAvatar";
import { DineeAddUserIcon } from "@/icons";
import type { EventSelection } from "@/types/dinee";
import { useTranslation } from "react-i18next";

export default function InvitationQueue({
  selections,
  busySelectionId,
  onCreate,
}: {
  selections: EventSelection[];
  busySelectionId: number | null;
  onCreate: (selection: EventSelection) => void;
}) {
  const { t } = useTranslation();

  if (selections.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {t("dinee.toInvite")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("dinee.toInviteDescription")}
        </p>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {selections.map((selection) => {
          const profile = selection.profile;
          const busy = busySelectionId === selection.id;
          return (
            <article
              key={selection.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar
                  firstName={profile.first_name}
                  lastName={profile.last_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                    {profile.first_name} {profile.last_name}
                  </p>
                  <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                    {profile.job_title || "—"}
                    {profile.company ? ` · ${profile.company}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCreate(selection)}
                disabled={busySelectionId !== null}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DineeAddUserIcon className="size-4" aria-hidden="true" />
                {busy
                  ? t("dinee.preparingInvitation")
                  : t("dinee.createInvitation")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
